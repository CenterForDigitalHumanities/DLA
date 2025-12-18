// Lightweight client helper to fetch proxied resources
window.DLA = window.DLA || {}
window.DLA.fetchResource = async function(id, { refresh = false } = {}) {
  if (!id) throw new Error('Missing id')
  const encoded = encodeURIComponent(id)
  const url = `/api/resource/${encoded}${refresh ? '?refresh=true' : ''}`
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok && res.status !== 206) throw new Error('Fetch failed: ' + res.status)
  const payload = await res.json()
  return payload
}

// Example: window.DLA.fetchResource('record-id').then(r => console.log(r))
