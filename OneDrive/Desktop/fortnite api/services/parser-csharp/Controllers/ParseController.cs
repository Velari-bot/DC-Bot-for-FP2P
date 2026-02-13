using Microsoft.AspNetCore.Mvc;

namespace ParserService.Controllers;

[ApiController]
[Route("[controller]")]
public class ParseController : ControllerBase
{
    private readonly ILogger<ParseController> _logger;
    private readonly IWebHostEnvironment _environment;

    public ParseController(ILogger<ParseController> logger, IWebHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    [HttpPost("parse")]
    public async Task<IActionResult> ParseReplay([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        try
        {
            // Save file temporarily
            var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}_{file.FileName}");
            using (var stream = new FileStream(tempPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation($"Processing replay file: {file.FileName} ({file.Length} bytes)");

            // Parse replay file
            var parsed = await ReplayParser.ParseAsync(tempPath);

            // Cleanup temp file
            try
            {
                System.IO.File.Delete(tempPath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Failed to delete temp file: {ex.Message}");
            }

            return Ok(parsed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing replay");
            return StatusCode(500, new { error = "Failed to parse replay", details = ex.Message });
        }
    }
}
