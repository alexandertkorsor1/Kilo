<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Services\ImageProcessor;
use Illuminate\Http\File;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PhotoController extends Controller
{
    public function index(): JsonResponse
    {
        $photos = Photo::query()
            ->where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get()
            ->map(function (Photo $photo) {
                return [
                    'id' => $photo->id,
                    'src' => $photo->image_path
                        ? url('/api/photos/'.$photo->id.'/image')
                        : $photo->external_url,
                    'alt' => $photo->alt,
                    'title' => $photo->title,
                    'category' => $photo->category,
                    'orientation' => $photo->orientation,
                ];
            });

        return response()->json([
            'photos' => $photos,
        ]);
    }

    public function adminIndex(): JsonResponse
    {
        $photos = Photo::query()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get()
            ->map(function (Photo $photo) {
                return [
                    'id' => $photo->id,
                    'src' => $photo->image_path
                        ? url('/api/admin/photos/'.$photo->id.'/image')
                        : $photo->external_url,
                    'title' => $photo->title,
                    'alt' => $photo->alt,
                    'category' => $photo->category,
                    'orientation' => $photo->orientation,
                    'is_temporary' => $photo->is_temporary,
                    'is_published' => $photo->is_published,
                    'sort_order' => $photo->sort_order,
                    'created_at' => $photo->created_at,
                ];
            });

        return response()->json(['photos' => $photos]);
    }


    public function store(Request $request, ImageProcessor $processor): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:10240', 'dimensions:max_width=4000,max_height=4000'],
            'title' => ['required', 'string', 'min:1', 'max:150'],
            'alt' => ['required', 'string', 'min:1', 'max:255'],
            'category' => ['required', 'in:Portrait,Landscape,Street,Wedding'],
            'orientation' => ['required', 'in:portrait,landscape'],
        ]);

        $processedPath = $processor->process($request->file('image'));
        $imagePath = null;

        try {
            $imagePath = Storage::disk('local')->putFile(
                'photos',
                new File($processedPath)
            );

            if ($imagePath === false) {
                throw new \RuntimeException('Unable to store processed image.');
            }

            $photo = Photo::create([
                'title' => $validated['title'],
                'alt' => $validated['alt'],
                'category' => $validated['category'],
                'orientation' => $validated['orientation'],
                'image_path' => $imagePath,
                'external_url' => null,
                'is_temporary' => false,
                'is_published' => false,
                'sort_order' => ((int) Photo::max('sort_order')) + 1,
            ]);
        } catch (\Throwable $exception) {
            if ($imagePath !== null && $imagePath !== false) {
                $this->deletePrivateImage($imagePath, 'failed photo upload');
            }

            throw $exception;
        } finally {
            if (is_file($processedPath)) {
                @unlink($processedPath);
            }
        }

        return response()->json([
            'message' => 'Photo uploaded successfully. It is currently unpublished.',
            'photo' => [
                'id' => $photo->id,
                'src' => url('/api/admin/photos/'.$photo->id.'/image'),
                'title' => $photo->title,
                'alt' => $photo->alt,
                'category' => $photo->category,
                'orientation' => $photo->orientation,
                'is_temporary' => $photo->is_temporary,
                'is_published' => $photo->is_published,
                'sort_order' => $photo->sort_order,
            ],
        ], 201);
    }

    public function update(Request $request, Photo $photo): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'min:1', 'max:150'],
            'alt' => ['sometimes', 'required', 'string', 'min:1', 'max:255'],
            'category' => ['sometimes', 'required', 'in:Portrait,Landscape,Street,Wedding'],
            'orientation' => ['sometimes', 'required', 'in:portrait,landscape'],
            'is_published' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $photo->update($validated);
        $photo->refresh();

        return response()->json([
            'message' => 'Photo updated successfully.',
            'photo' => [
                'id' => $photo->id,
                'src' => $photo->image_path
                    ? url('/api/admin/photos/'.$photo->id.'/image')
                    : $photo->external_url,
                'title' => $photo->title,
                'alt' => $photo->alt,
                'category' => $photo->category,
                'orientation' => $photo->orientation,
                'is_temporary' => $photo->is_temporary,
                'is_published' => $photo->is_published,
                'sort_order' => $photo->sort_order,
            ],
        ]);
    }


    public function replaceImage(
        Request $request,
        Photo $photo,
        ImageProcessor $processor
    ): JsonResponse {
        $validated = $request->validate([
            'image' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp',
                'max:10240',
                'dimensions:max_width=4000,max_height=4000',
            ],
        ]);

        $processedPath = $processor->process($request->file('image'));
        $oldImagePath = $photo->image_path;
        $newImagePath = null;

        try {
            $newImagePath = Storage::disk('local')->putFile(
                'photos',
                new File($processedPath)
            );

            if ($newImagePath === false) {
                throw new \RuntimeException('Unable to store processed image.');
            }

            if (! $photo->update([
                'image_path' => $newImagePath,
                'external_url' => null,
                'is_temporary' => false,
            ])) {
                throw new \RuntimeException('Unable to update photo record.');
            }
        } catch (\Throwable $exception) {
            if ($newImagePath !== null && $newImagePath !== false) {
                $this->deletePrivateImage($newImagePath, 'failed photo replacement');
            }

            throw $exception;
        } finally {
            if (is_file($processedPath)) {
                @unlink($processedPath);
            }
        }

        if ($oldImagePath) {
            $this->deleteStoredImage($oldImagePath, 'old image after replacement');
        }

        $photo->refresh();

        return response()->json([
            'message' => 'Photo image replaced successfully.',
            'photo' => [
                'id' => $photo->id,
                'src' => url('/api/admin/photos/'.$photo->id.'/image'),
                'title' => $photo->title,
                'alt' => $photo->alt,
                'category' => $photo->category,
                'orientation' => $photo->orientation,
                'is_temporary' => $photo->is_temporary,
                'is_published' => $photo->is_published,
                'sort_order' => $photo->sort_order,
            ],
        ]);
    }


    public function servePublicImage(Photo $photo)
    {
        abort_unless($photo->is_published, 404);
        abort_unless($photo->image_path, 404);

        $disk = Storage::disk('local');

        abort_unless($disk->exists($photo->image_path), 404);

        return response()->file($disk->path($photo->image_path), [
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function serveAdminImage(Photo $photo)
    {
        abort_unless($photo->image_path, 404);

        $disk = Storage::disk('local');

        abort_unless($disk->exists($photo->image_path), 404);

        return response()->file($disk->path($photo->image_path), [
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function destroy(Photo $photo): JsonResponse
    {
        $imagePath = $photo->image_path;

        $photo->delete();

        if ($imagePath) {
            $this->deleteStoredImage($imagePath, 'deleted photo image');
        }

        return response()->json([
            'message' => 'Photo deleted successfully.',
        ]);
    }

    private function deletePrivateImage(string $path, string $context): void
    {
        try {
            if (! Storage::disk('local')->delete($path)) {
                Log::error('Kilo private image cleanup failed.', [
                    'context' => $context,
                    'path' => $path,
                ]);
            }
        } catch (\Throwable $exception) {
            Log::error('Kilo private image cleanup raised an exception.', [
                'context' => $context,
                'path' => $path,
                'exception' => $exception->getMessage(),
            ]);
        }
    }

    private function deleteStoredImage(string $path, string $context): void
    {
        try {
            if (Storage::disk("local")->exists($path)) {
                $disk = Storage::disk("local");
            } elseif (Storage::disk("public")->exists($path)) {
                $disk = Storage::disk("public");
            } else {
                Log::error("Kilo image cleanup failed: file not found.", [
                    "context" => $context,
                    "path" => $path,
                ]);
                return;
            }

            if (! $disk->delete($path)) {
                Log::error("Kilo image cleanup failed.", [
                    "context" => $context,
                    "path" => $path,
                ]);
            }
        } catch (\Throwable $exception) {
            Log::error("Kilo image cleanup raised an exception.", [
                "context" => $context,
                "path" => $path,
                "exception" => $exception->getMessage(),
            ]);
        }
    }

}
