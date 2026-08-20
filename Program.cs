using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// تفعيل الملفات الافتراضية مثل index.html
app.UseDefaultFiles();

// تفعيل الملفات الثابتة مع تحديد مسار wwwroot بشكل صريح
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot")),
    RequestPath = ""
});

app.Run();