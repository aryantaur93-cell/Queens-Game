param(
    [int]$Port = 8080,
    [string]$Directory = $PSScriptRoot
)

if (-not $Directory) {
    $Directory = $PSScriptRoot
}

$ip = [System.Net.IPAddress]::Loopback
$listener = New-Object System.Net.Sockets.TcpListener($ip, $Port)

try {
    $listener.Start()
    Write-Host "Queens Game Local Server started at http://localhost:$Port/"
    Write-Host "Serving directory: $Directory"
} catch {
    Write-Error "Failed to start listener on port $Port : $_"
    exit 1
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        # Read remaining headers
        while ($line = $reader.ReadLine()) {
            if ($line.Trim() -eq "") { break }
        }

        $tokens = $requestLine.Split(' ')
        if ($tokens.Count -lt 2) {
            $client.Close()
            continue
        }

        $url = $tokens[1]
        if ($url -eq "/" -or $url -eq "") {
            $url = "/index.html"
        }

        $cleanPath = $url.Split('?')[0].TrimStart('/').Replace('/', '\')
        $targetFile = Join-Path $Directory $cleanPath

        $ext = [System.IO.Path]::GetExtension($targetFile).ToLower()
        $contentType = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            ".json" { "application/json; charset=utf-8" }
            ".svg"  { "image/svg+xml" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".ico"  { "image/x-icon" }
            default { "application/octet-stream" }
        }

        if (Test-Path $targetFile -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($targetFile)
            $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $msg = "404 Not Found"
            $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
            $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($msgBytes.Length)`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($msgBytes, 0, $msgBytes.Length)
        }

        $stream.Flush()
        $client.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped."
}
