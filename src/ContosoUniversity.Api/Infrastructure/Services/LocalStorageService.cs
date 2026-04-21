using ContosoUniversity.Api.Application.Interfaces;

namespace ContosoUniversity.Api.Infrastructure.Services;

public class LocalStorageService : IStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".bmp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/bmp"
    };

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private readonly string _uploadPath;

    public LocalStorageService(IConfiguration configuration)
    {
        _uploadPath = configuration.GetValue<string>("Storage:UploadPath") ?? "Uploads";
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        if (!AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException($"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", AllowedExtensions)}");
        }

        if (stream.CanSeek && stream.Length > MaxFileSizeBytes)
        {
            throw new InvalidOperationException($"File size exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");
        }

        var storedFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(_uploadPath, storedFileName);

        using var fileStream = new FileStream(filePath, FileMode.Create);
        await stream.CopyToAsync(fileStream, cancellationToken);

        return storedFileName;
    }

    public Task DeleteAsync(string path, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_uploadPath, path);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
        return Task.CompletedTask;
    }

    public Task<Stream?> GetStreamAsync(string path, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_uploadPath, path);
        if (!File.Exists(filePath))
        {
            return Task.FromResult<Stream?>(null);
        }

        Stream stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        return Task.FromResult<Stream?>(stream);
    }

    public static bool IsValidContentType(string? contentType)
    {
        return contentType is not null && AllowedContentTypes.Contains(contentType);
    }

    public static bool IsValidExtension(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        return AllowedExtensions.Contains(extension);
    }

    public static bool IsValidSize(long size)
    {
        return size <= MaxFileSizeBytes;
    }
}
