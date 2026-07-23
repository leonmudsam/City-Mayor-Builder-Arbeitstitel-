param(
  [Parameter(Mandatory = $true)][string]$MountainSource,
  [Parameter(Mandatory = $true)][string]$GrassSource,
  [Parameter(Mandatory = $true)][string]$ForestSource,
  [Parameter(Mandatory = $true)][string]$CoastSource
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class TerrainTextureProcessor
{
    private const int Size = 2048;

    private static Bitmap LoadAndResize(string source)
    {
        using (var input = new Bitmap(source))
        {
            var result = new Bitmap(Size, Size, PixelFormat.Format32bppArgb);
            using (var graphics = Graphics.FromImage(result))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.DrawImage(input, new Rectangle(0, 0, Size, Size));
            }
            return result;
        }
    }

    private static byte Clamp(float value)
    {
        return (byte)Math.Max(0, Math.Min(255, (int)Math.Round(value)));
    }

    public static void Variant(string source, string destination, float red, float green, float blue, float contrast, float lift)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(destination));
        using (var bitmap = LoadAndResize(source))
        {
            var rect = new Rectangle(0, 0, Size, Size);
            var data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            var bytes = new byte[Math.Abs(data.Stride) * Size];
            Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
            for (var y = 0; y < Size; y++)
            {
                var row = y * Math.Abs(data.Stride);
                for (var x = 0; x < Size; x++)
                {
                    var i = row + x * 4;
                    bytes[i] = Clamp(((bytes[i] - 128f) * contrast + 128f) * blue + lift);
                    bytes[i + 1] = Clamp(((bytes[i + 1] - 128f) * contrast + 128f) * green + lift);
                    bytes[i + 2] = Clamp(((bytes[i + 2] - 128f) * contrast + 128f) * red + lift);
                    bytes[i + 3] = 255;
                }
            }
            Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
            bitmap.UnlockBits(data);
            bitmap.Save(destination, ImageFormat.Png);
        }
    }

    public static void MaterialMaps(string colorSource, string normalDestination, string roughnessDestination, string aoDestination, float normalStrength, int roughnessBase)
    {
        using (var bitmap = new Bitmap(colorSource))
        {
            var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
            var inputData = bitmap.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            var stride = Math.Abs(inputData.Stride);
            var input = new byte[stride * bitmap.Height];
            Marshal.Copy(inputData.Scan0, input, 0, input.Length);
            bitmap.UnlockBits(inputData);

            var luminance = new float[bitmap.Width * bitmap.Height];
            for (var y = 0; y < bitmap.Height; y++)
            {
                var row = y * stride;
                for (var x = 0; x < bitmap.Width; x++)
                {
                    var i = row + x * 4;
                    luminance[y * bitmap.Width + x] = (input[i + 2] * 0.2126f + input[i + 1] * 0.7152f + input[i] * 0.0722f) / 255f;
                }
            }

            SaveDerived(bitmap.Width, bitmap.Height, normalDestination, (x, y, channel) =>
            {
                var left = luminance[y * bitmap.Width + (x + bitmap.Width - 1) % bitmap.Width];
                var right = luminance[y * bitmap.Width + (x + 1) % bitmap.Width];
                var up = luminance[((y + bitmap.Height - 1) % bitmap.Height) * bitmap.Width + x];
                var down = luminance[((y + 1) % bitmap.Height) * bitmap.Width + x];
                var nx = (left - right) * normalStrength;
                var ny = (up - down) * normalStrength;
                var nz = 1f;
                var inv = 1f / (float)Math.Sqrt(nx * nx + ny * ny + nz * nz);
                nx *= inv; ny *= inv; nz *= inv;
                if (channel == 0) return Clamp((nz * 0.5f + 0.5f) * 255f);
                if (channel == 1) return Clamp((ny * 0.5f + 0.5f) * 255f);
                return Clamp((nx * 0.5f + 0.5f) * 255f);
            });

            SaveDerived(bitmap.Width, bitmap.Height, roughnessDestination, (x, y, channel) =>
            {
                var l = luminance[y * bitmap.Width + x];
                return Clamp(roughnessBase + (1f - Math.Abs(l - 0.5f) * 2f) * 35f);
            });

            SaveDerived(bitmap.Width, bitmap.Height, aoDestination, (x, y, channel) =>
            {
                var l = luminance[y * bitmap.Width + x];
                return Clamp(172f + l * 83f);
            });
        }
    }

    private static void SaveDerived(int width, int height, string destination, Func<int, int, int, byte> sample)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(destination));
        using (var output = new Bitmap(width, height, PixelFormat.Format32bppArgb))
        {
            var rect = new Rectangle(0, 0, width, height);
            var data = output.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
            var stride = Math.Abs(data.Stride);
            var bytes = new byte[stride * height];
            for (var y = 0; y < height; y++)
            {
                var row = y * stride;
                for (var x = 0; x < width; x++)
                {
                    var i = row + x * 4;
                    bytes[i] = sample(x, y, 0);
                    bytes[i + 1] = sample(x, y, 1);
                    bytes[i + 2] = sample(x, y, 2);
                    bytes[i + 3] = 255;
                }
            }
            Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
            output.UnlockBits(data);
            output.Save(destination, ImageFormat.Png);
        }
    }
}
'@

function Add-Variant {
  param([string]$Source, [string]$RelativePath, [float]$R, [float]$G, [float]$B, [float]$Contrast = 1, [float]$Lift = 0)
  $destination = Join-Path $repoRoot "src/assets/textures/terrain/$RelativePath"
  [TerrainTextureProcessor]::Variant($Source, $destination, $R, $G, $B, $Contrast, $Lift)
}

$mountain = @(
  @('mountain/mountain_granite_base.png', 1.00, 1.00, 1.00, 1.08, 0),
  @('mountain/mountain_granite_light.png', 1.14, 1.12, 1.08, 1.04, 5),
  @('mountain/mountain_granite_dark.png', 0.72, 0.75, 0.78, 1.18, -8),
  @('mountain/mountain_cliff_faceted.png', 0.90, 0.93, 0.98, 1.34, -4),
  @('mountain/mountain_strata.png', 1.02, 0.95, 0.86, 1.20, -2),
  @('mountain/mountain_scree.png', 0.84, 0.81, 0.76, 0.90, 9),
  @('mountain/mountain_moss.png', 0.69, 0.86, 0.54, 0.95, -5),
  @('mountain/mountain_snow.png', 1.24, 1.25, 1.28, 0.72, 26),
  @('mountain/mountain_wet_rock.png', 0.54, 0.64, 0.70, 1.22, -10)
)
foreach ($entry in $mountain) { Add-Variant -Source $MountainSource -RelativePath $entry[0] -R $entry[1] -G $entry[2] -B $entry[3] -Contrast $entry[4] -Lift $entry[5] }

$grass = @(
  @('grass/grass_meadow_fresh.png', 1.00, 1.00, 1.00, 1.05, 0),
  @('grass/grass_meadow_dark.png', 0.62, 0.77, 0.58, 1.08, -6),
  @('grass/grass_meadow_dry.png', 1.10, 0.96, 0.58, 1.08, 3),
  @('grass/grass_soft_ground.png', 0.82, 0.78, 0.58, 0.88, -2),
  @('grass/grass_mossy.png', 0.67, 0.88, 0.58, 0.96, -4),
  @('grass/grass_wildflowers.png', 1.04, 1.04, 0.98, 1.16, 0),
  @('grass/grass_trampled.png', 0.84, 0.76, 0.50, 0.92, -5),
  @('grass/grass_wet.png', 0.50, 0.74, 0.62, 1.10, -8),
  @('dryland/dry_steppe.png', 1.12, 0.88, 0.48, 1.14, 2),
  @('fertile/fertile_valley_ground.png', 0.62, 0.82, 0.48, 1.02, -6)
)
foreach ($entry in $grass) { Add-Variant -Source $GrassSource -RelativePath $entry[0] -R $entry[1] -G $entry[2] -B $entry[3] -Contrast $entry[4] -Lift $entry[5] }

$forest = @(
  @('forest/forest_floor_needles.png', 0.76, 0.65, 0.47, 1.10, -4),
  @('forest/forest_floor_moss.png', 0.72, 0.90, 0.64, 1.04, -2),
  @('forest/forest_floor_leaves.png', 0.92, 0.74, 0.53, 1.10, 0),
  @('forest/forest_floor_dark_soil.png', 0.57, 0.51, 0.43, 1.16, -9),
  @('forest/forest_floor_roots.png', 0.70, 0.57, 0.43, 1.22, -4),
  @('forest/forest_edge_grass.png', 0.74, 1.00, 0.67, 0.96, 1),
  @('moorland/moor_heather_ground.png', 0.78, 0.58, 0.82, 1.05, -4)
)
foreach ($entry in $forest) { Add-Variant -Source $ForestSource -RelativePath $entry[0] -R $entry[1] -G $entry[2] -B $entry[3] -Contrast $entry[4] -Lift $entry[5] }

$coast = @(
  @('coast/coast_shore_accessible.png', 1.00, 1.00, 1.00, 1.06, 0),
  @('coast/coast_sand_wet.png', 0.84, 0.82, 0.70, 1.08, -5),
  @('coast/coast_gravel_stylized.png', 0.78, 0.84, 0.88, 1.18, -2),
  @('coast/coast_mud_fertile.png', 0.70, 0.60, 0.44, 1.08, -8)
)
foreach ($entry in $coast) { Add-Variant -Source $CoastSource -RelativePath $entry[0] -R $entry[1] -G $entry[2] -B $entry[3] -Contrast $entry[4] -Lift $entry[5] }

$mapSets = @(
  @('mountain/mountain_granite_base', 3.2, 205),
  @('mountain/mountain_cliff_faceted', 4.0, 215),
  @('grass/grass_meadow_fresh', 1.6, 190),
  @('forest/forest_floor_moss', 2.2, 210),
  @('coast/coast_shore_accessible', 2.0, 198)
)
foreach ($entry in $mapSets) {
  $base = Join-Path $repoRoot "src/assets/textures/terrain/$($entry[0]).png"
  [TerrainTextureProcessor]::MaterialMaps(
    $base,
    (Join-Path $repoRoot "src/assets/textures/terrain/$($entry[0])_normal.png"),
    (Join-Path $repoRoot "src/assets/textures/terrain/$($entry[0])_roughness.png"),
    (Join-Path $repoRoot "src/assets/textures/terrain/$($entry[0])_ao.png"),
    $entry[1],
    $entry[2]
  )
}

Write-Output 'Terrainmaterialien auf 2048×2048 verarbeitet.'
