namespace ContosoUniversity.Api.Services;

public interface IStorageService
{
    Task<string> SaveAsync(IFormFile file, string prefix, CancellationToken cancellationToken = default);
    Task<(Stream Stream, string ContentType, string FileName)?> OpenReadAsync(string storedPath, CancellationToken cancellationToken = default);
    Task DeleteIfExistsAsync(string storedPath, CancellationToken cancellationToken = default);
}
