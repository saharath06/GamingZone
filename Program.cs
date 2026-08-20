using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// تفعيل الملفات الافتراضية (مثل index.html)
app.UseDefaultFiles();

// إعداد صريح ومضمون لـ MIME Types لضمان عدم رفض المتصفح لملفات التصميم والـ JS
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".css"] = "text/css";
provider.Mappings[".js"] = "application/javascript";
provider.Mappings[".html"] = "text/html";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider
});

app.Run();