export default defineEventHandler(async (event) => {
  // @ts-expect-error
  const body = event.req.method === 'POST' ? await useBody(event) : {}
  const data = {
    // @ts-expect-error
    url: event.req.url,
    // @ts-expect-error
    method: event.req.method,
    body,
  }
  console.log(data)
  return data
})
