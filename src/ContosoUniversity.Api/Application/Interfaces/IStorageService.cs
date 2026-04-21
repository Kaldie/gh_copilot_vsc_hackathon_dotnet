namespace ContosoUniversity.Api.Application.Interfaces;

public interface IStorageService
{
    Task<string> SaveAsync(Stream stream, string fileName, CancellationToken cancellationToken = default);
    Task DeleteAsync(string path, CancellationToken cancellationToken = default);
    Task<Stream?> GetStreamAsync(string path, CancellationToken cancellationToken = default);
}
