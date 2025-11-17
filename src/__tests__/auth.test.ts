import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Better Auth API Routes', () => {
  const baseUrl = 'http://localhost:3000'

  it('should respond to sign-up email endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User',
      }),
    })

    // Should not return 404
    expect(response.status).not.toBe(404)

    // Should return either 200 (success) or 400 (validation error), but route should exist
    expect([200, 201, 400, 401].includes(response.status)).toBe(true)
  })

  it('should respond to sign-in email endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
      }),
    })

    // Should not return 404
    expect(response.status).not.toBe(404)
  })

  it('should respond to session endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'GET',
    })

    // Should not return 404
    expect(response.status).not.toBe(404)
    expect(response.status).toBe(200)
  })
})
