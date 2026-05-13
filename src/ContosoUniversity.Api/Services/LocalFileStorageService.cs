namespace ContosoUniversity.Api.Services;

public sealed class LocalFileStorageService(IWebHostEnvironment env, IConfiguration configuration) : IStorageService
{
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
    private const long MaxFileSizeBytes = 5 * 1024 * 1024;

    private readonly string _rootPath = Path.Combine(
        env.ContentRootPath,
        configuration["Storage:RootPath"] ?? "uploads",
        "teaching-materials");

    public async Task<string> SaveAsync(IFormFile file, string prefix, CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
        {
            throw new InvalidOperationException("Uploaded file is empty.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new InvalidOperationException("File size must be less than 5MB.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Please upload a valid image file (jpg, jpeg, png, gif, bmp).");
        }

        Directory.CreateDirectory(_rootPath);

        var fileName = $"{prefix}_{Guid.NewGuid():N}{extension}";
        var absolutePath = Path.Combine(_rootPath, fileName);

        await using var target = new FileStream(absolutePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await file.CopyToAsync(target, cancellationToken);

        return $"teaching-materials/{fileName}";
    }

    public Task<(Stream Stream, string ContentType, string FileName)?> OpenReadAsync(string storedPath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storedPath))
        {
            return Task.FromResult<(Stream, string, string)?>(null);
        }

        var relativePath = storedPath.Replace('/', Path.DirectorySeparatorChar);
        var absolutePath = Path.Combine(env.ContentRootPath, configuration["Storage:RootPath"] ?? "uploads", relativePath);
        if (!File.Exists(absolutePath))
        {
            return Task.FromResult<(Stream, string, string)?>(null);
        }

        var stream = new FileStream(absolutePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var extension = Path.GetExtension(absolutePath).ToLowerInvariant();
        var contentType = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            _ => "application/octet-stream",
        };

        return Task.FromResult<(Stream, string, string)?>(
            (stream, contentType, Path.GetFileName(absolutePath)));
    }

    public Task DeleteIfExistsAsync(string storedPath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storedPath))
        {
            return Task.CompletedTask;
        }

        var relativePath = storedPath.Replace('/', Path.DirectorySeparatorChar);
        var absolutePath = Path.Combine(env.ContentRootPath, configuration["Storage:RootPath"] ?? "uploads", relativePath);
        if (File.Exists(absolutePath))
        {
            File.Delete(absolutePath);
        }

        return Task.CompletedTask;
    }
}
