export function errorPage(status, message) {
  const statusText = {
    404: 'Not Found',
    500: 'Internal Server Error',
    403: 'Forbidden',
    400: 'Bad Request'
  }[status] || 'Error'

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${status} - ${statusText}</title>
    <style>
      body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width: 720px; margin: 48px auto; padding: 20px; color: #222; }
      h1 { color: #c62828; margin-bottom: 0.2em }
      p { margin-top: 0 }
      .details { background: #f7f7f7; padding: 12px; border-left: 4px solid #e57373; margin: 18px 0; }
      a { color: #1565c0; }
    </style>
  </head>
  <body>
    <h1>${status} ${statusText}</h1>
    <p>${message}</p>
    <div class="details">Try checking the URL, or return to the <a href="/">home page</a>.</div>
  </body>
</html>`
}
