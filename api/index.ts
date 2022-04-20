import { defineEventHandler, useBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await useBody(event)
  const data = {
    // @ts-ignore
    url: event.req.url,
    // @ts-ignore
    method: event.req.method,
    body,
  }
  return data
})
