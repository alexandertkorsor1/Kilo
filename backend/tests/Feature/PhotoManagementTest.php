<?php

namespace Tests\Feature;

use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class PhotoManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_view_a_published_private_image(): void
    {
        Storage::fake('local');

        $imagePath = UploadedFile::fake()
            ->image('published.jpg', 20, 20)
            ->store('photos', 'local');

        $photo = Photo::create([
            'title' => 'Published Private Image',
            'alt' => 'Published test image',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'image_path' => $imagePath,
            'is_temporary' => false,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        $this->get("/api/photos/{$photo->id}/image")
            ->assertOk();
    }

    public function test_public_cannot_view_an_unpublished_private_image(): void
    {
        Storage::fake('local');

        $imagePath = UploadedFile::fake()
            ->image('unpublished.jpg', 20, 20)
            ->store('photos', 'local');

        $photo = Photo::create([
            'title' => 'Unpublished Private Image',
            'alt' => 'Unpublished test image',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'image_path' => $imagePath,
            'is_temporary' => false,
            'is_published' => false,
            'sort_order' => 1,
        ]);

        $this->get("/api/photos/{$photo->id}/image")
            ->assertNotFound();
    }

    public function test_unauthenticated_user_cannot_view_admin_private_image(): void
    {
        Storage::fake('local');

        $imagePath = UploadedFile::fake()
            ->image('admin-only.jpg', 20, 20)
            ->store('photos', 'local');

        $photo = Photo::create([
            'title' => 'Admin Only Image',
            'alt' => 'Admin test image',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'image_path' => $imagePath,
            'is_temporary' => false,
            'is_published' => false,
            'sort_order' => 1,
        ]);

        $this->getJson("/api/admin/photos/{$photo->id}/image")
            ->assertUnauthorized();
    }

    public function test_admin_can_view_an_unpublished_private_image(): void
    {
        Storage::fake('local');

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $imagePath = UploadedFile::fake()
            ->image('admin-preview.jpg', 20, 20)
            ->store('photos', 'local');

        $photo = Photo::create([
            'title' => 'Admin Preview Image',
            'alt' => 'Admin preview test image',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'image_path' => $imagePath,
            'is_temporary' => false,
            'is_published' => false,
            'sort_order' => 1,
        ]);

        $this->actingAs($admin, 'web')
            ->get("/api/admin/photos/{$photo->id}/image")
            ->assertOk();
    }

    public function test_unauthenticated_user_cannot_list_admin_photos(): void
    {
        $this->getJson('/api/admin/photos')
            ->assertUnauthorized();
    }

    public function test_staff_member_cannot_list_admin_photos(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'is_active' => true,
        ]);

        $this->actingAs($staff, 'web')
            ->getJson('/api/admin/photos')
            ->assertForbidden()
            ->assertJsonPath('message', 'Administrator access required.');
    }

    public function test_admin_can_list_published_and_unpublished_photos(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        Photo::create([
            'title' => 'Published Photo',
            'alt' => 'A published test photo',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/published.jpg',
            'is_temporary' => true,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        Photo::create([
            'title' => 'Unpublished Photo',
            'alt' => 'An unpublished test photo',
            'category' => 'Landscape',
            'orientation' => 'landscape',
            'external_url' => 'https://example.com/unpublished.jpg',
            'is_temporary' => false,
            'is_published' => false,
            'sort_order' => 2,
        ]);

        $this->actingAs($admin, 'web')
            ->getJson('/api/admin/photos')
            ->assertOk()
            ->assertJsonCount(2, 'photos')
            ->assertJsonPath('photos.0.title', 'Published Photo')
            ->assertJsonPath('photos.1.title', 'Unpublished Photo')
            ->assertJsonPath('photos.1.is_published', false);
    }

    public function test_unauthenticated_user_cannot_upload_a_photo(): void
    {
        Storage::fake('public');

        $this->postJson('/api/admin/photos', [])
            ->assertUnauthorized();

        $this->assertDatabaseCount('photos', 0);
    }

    public function test_staff_member_cannot_upload_a_photo(): void
    {
        Storage::fake('public');

        $staff = User::factory()->create([
            'role' => 'staff',
            'is_active' => true,
        ]);

        $this->actingAs($staff, 'web')
            ->post('/api/admin/photos', [])
            ->assertForbidden();

        $this->assertDatabaseCount('photos', 0);
    }

    public function test_admin_can_upload_a_photo_as_unpublished(): void
    {
        Storage::fake('local');

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $image = UploadedFile::fake()->image('portfolio.jpg', 1200, 800);

        $response = $this->actingAs($admin, 'web')
            ->post('/api/admin/photos', [
                'image' => $image,
                'title' => 'Test Portfolio Photo',
                'alt' => 'A test photograph',
                'category' => 'Portrait',
                'orientation' => 'landscape',
            ]);

        $response->assertCreated()
            ->assertJsonPath('photo.title', 'Test Portfolio Photo')
            ->assertJsonPath('photo.is_published', false)
            ->assertJsonPath('photo.is_temporary', false);

        $photo = Photo::where('title', 'Test Portfolio Photo')->firstOrFail();

        $this->assertNotNull($photo->image_path);
        $this->assertNull($photo->external_url);
        $this->assertFalse($photo->is_published);

        Storage::disk('local')->assertExists($photo->image_path);
    }


    public function test_unauthenticated_user_cannot_update_a_photo(): void
    {
        $photo = Photo::create([
            'title' => 'Original Photo',
            'alt' => 'Original description',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/original.jpg',
            'is_temporary' => true,
            'is_published' => false,
            'sort_order' => 1,
        ]);

        $this->patchJson("/api/admin/photos/{$photo->id}", [
            'title' => 'Updated Photo',
        ])->assertUnauthorized();

        $this->assertDatabaseHas('photos', [
            'id' => $photo->id,
            'title' => 'Original Photo',
        ]);
    }

    public function test_staff_member_cannot_update_a_photo(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'is_active' => true,
        ]);

        $photo = Photo::create([
            'title' => 'Original Photo',
            'alt' => 'Original description',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/original.jpg',
            'is_temporary' => true,
            'is_published' => false,
            'sort_order' => 1,
        ]);

        $this->actingAs($staff, 'web')
            ->patchJson("/api/admin/photos/{$photo->id}", [
                'title' => 'Updated Photo',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('photos', [
            'id' => $photo->id,
            'title' => 'Original Photo',
        ]);
    }

    public function test_admin_can_update_photo_metadata_publication_and_order(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $photo = Photo::create([
            'title' => 'Original Photo',
            'alt' => 'Original description',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/original.jpg',
            'is_temporary' => true,
            'is_published' => false,
            'sort_order' => 1,
        ]);

        $this->actingAs($admin, 'web')
            ->patchJson("/api/admin/photos/{$photo->id}", [
                'title' => 'Updated Photo',
                'alt' => 'Updated description',
                'category' => 'Wedding',
                'orientation' => 'landscape',
                'is_published' => true,
                'sort_order' => 5,
            ])
            ->assertOk()
            ->assertJsonPath('photo.title', 'Updated Photo')
            ->assertJsonPath('photo.category', 'Wedding')
            ->assertJsonPath('photo.is_published', true)
            ->assertJsonPath('photo.sort_order', 5);

        $this->assertDatabaseHas('photos', [
            'id' => $photo->id,
            'title' => 'Updated Photo',
            'alt' => 'Updated description',
            'category' => 'Wedding',
            'orientation' => 'landscape',
            'is_published' => true,
            'sort_order' => 5,
        ]);
    }

    public function test_admin_cannot_update_photo_with_invalid_category(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $photo = Photo::create([
            'title' => 'Original Photo',
            'alt' => 'Original description',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/original.jpg',
            'is_temporary' => true,
            'is_published' => false,
            'sort_order' => 1,
        ]);

        $this->actingAs($admin, 'web')
            ->patchJson("/api/admin/photos/{$photo->id}", [
                'category' => 'InvalidCategory',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('photos', [
            'id' => $photo->id,
            'category' => 'Portrait',
        ]);
    }


    public function test_unauthenticated_user_cannot_replace_a_photo_image(): void
    {
        Storage::fake('public');

        $photo = Photo::create([
            'title' => 'Original Photo',
            'alt' => 'Original description',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/original.jpg',
            'is_temporary' => true,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        $this->postJson("/api/admin/photos/{$photo->id}/image", [
            'image' => UploadedFile::fake()->image('replacement.jpg'),
        ])->assertUnauthorized();

        $this->assertDatabaseHas('photos', [
            'id' => $photo->id,
            'external_url' => 'https://example.com/original.jpg',
        ]);
    }

    public function test_staff_member_cannot_replace_a_photo_image(): void
    {
        Storage::fake('public');

        $staff = User::factory()->create([
            'role' => 'staff',
            'is_active' => true,
        ]);

        $photo = Photo::create([
            'title' => 'Original Photo',
            'alt' => 'Original description',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/original.jpg',
            'is_temporary' => true,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($staff, 'web')
            ->post("/api/admin/photos/{$photo->id}/image", [
                'image' => UploadedFile::fake()->image('replacement.jpg'),
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('photos', [
            'id' => $photo->id,
            'external_url' => 'https://example.com/original.jpg',
        ]);
    }

    public function test_admin_can_replace_a_photo_image_and_preserve_publication_status(): void
    {
        Storage::fake('local');

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $photo = Photo::create([
            'title' => 'Original Photo',
            'alt' => 'Original description',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/original.jpg',
            'is_temporary' => true,
            'is_published' => true,
            'sort_order' => 3,
        ]);

        $response = $this->actingAs($admin, 'web')
            ->post("/api/admin/photos/{$photo->id}/image", [
                'image' => UploadedFile::fake()->image('replacement.jpg'),
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Photo image replaced successfully.')
            ->assertJsonPath('photo.is_published', true)
            ->assertJsonPath('photo.is_temporary', false);

        $photo->refresh();

        $this->assertNotNull($photo->image_path);
        $this->assertNull($photo->external_url);
        $this->assertTrue($photo->is_published);
        $this->assertSame('Original Photo', $photo->title);

        Storage::disk('local')->assertExists($photo->image_path);
    }


    public function test_unauthenticated_user_cannot_delete_a_photo(): void
    {
        $photo = Photo::create([
            'title' => 'Protected Photo',
            'alt' => 'A protected photo',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/protected.jpg',
            'is_temporary' => true,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        $this->deleteJson("/api/admin/photos/{$photo->id}")
            ->assertUnauthorized();

        $this->assertDatabaseHas('photos', ['id' => $photo->id]);
    }

    public function test_staff_member_cannot_delete_a_photo(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'is_active' => true,
        ]);

        $photo = Photo::create([
            'title' => 'Protected Photo',
            'alt' => 'A protected photo',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'external_url' => 'https://example.com/protected.jpg',
            'is_temporary' => true,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($staff, 'web')
            ->deleteJson("/api/admin/photos/{$photo->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('photos', ['id' => $photo->id]);
    }

    public function test_admin_can_delete_a_photo_and_its_local_image(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $imagePath = UploadedFile::fake()
            ->image('portfolio.jpg')
            ->store('photos', 'public');

        $photo = Photo::create([
            'title' => 'Local Photo',
            'alt' => 'A locally stored photo',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'image_path' => $imagePath,
            'external_url' => null,
            'is_temporary' => false,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        Storage::disk('public')->assertExists($imagePath);

        $this->actingAs($admin, 'web')
            ->deleteJson("/api/admin/photos/{$photo->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Photo deleted successfully.');

        $this->assertDatabaseMissing('photos', ['id' => $photo->id]);
        Storage::disk('public')->assertMissing($imagePath);
    }

    public function test_admin_can_delete_an_externally_hosted_photo_record(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $photo = Photo::create([
            'title' => 'External Photo',
            'alt' => 'An externally hosted photo',
            'category' => 'Landscape',
            'orientation' => 'landscape',
            'image_path' => null,
            'external_url' => 'https://example.com/external.jpg',
            'is_temporary' => true,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($admin, 'web')
            ->deleteJson("/api/admin/photos/{$photo->id}")
            ->assertOk();

        $this->assertDatabaseMissing('photos', ['id' => $photo->id]);
    }


    public function test_admin_deletion_logs_when_local_image_cleanup_fails(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $imagePath = 'photos/unavailable.jpg';

        $photo = Photo::create([
            'title' => 'Cleanup Failure Photo',
            'alt' => 'A photo used to test cleanup failure',
            'category' => 'Portrait',
            'orientation' => 'portrait',
            'image_path' => $imagePath,
            'external_url' => null,
            'is_temporary' => false,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        $localDisk = \Mockery::mock();
        $localDisk->shouldReceive('exists')
            ->once()
            ->with($imagePath)
            ->andReturn(false);

        $publicDisk = \Mockery::mock();
        $publicDisk->shouldReceive('exists')
            ->once()
            ->with($imagePath)
            ->andReturn(true);
        $publicDisk->shouldReceive('delete')
            ->once()
            ->with($imagePath)
            ->andReturn(false);

        Storage::shouldReceive('disk')
            ->once()
            ->with('local')
            ->andReturn($localDisk);

        Storage::shouldReceive('disk')
            ->twice()
            ->with('public')
            ->andReturn($publicDisk);

        Log::shouldReceive('error')
            ->once()
            ->with('Kilo image cleanup failed.', [
                'context' => 'deleted photo image',
                'path' => $imagePath,
            ]);

        $this->actingAs($admin, 'web')
            ->deleteJson("/api/admin/photos/{$photo->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Photo deleted successfully.');

        $this->assertDatabaseMissing('photos', ['id' => $photo->id]);
    }

}
