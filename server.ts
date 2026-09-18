import express from 'express'
import path from 'node:path'

const app = express()
const port = Number(process.env.PORT) || 8787
const root = process.cwd()

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, revision: process.env.DEPLOYMENT_SHA || 'development' })
})

app.use(express.static(path.join(root, 'dist')))
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(root, 'dist', 'index.html'))
})

app.listen(port, () => {
  console.log(`Soaply CRM is running on http://localhost:${port}`)
})