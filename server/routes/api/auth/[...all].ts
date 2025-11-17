import { auth } from '../../../src/lib/auth'

export default defineEventHandler(async (event) => {
  return await auth.handler(event.node.req)
})
