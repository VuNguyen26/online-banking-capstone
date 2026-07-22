describe('frontend test tooling', () => {
  it('provides a browser-like DOM and jest-dom matchers', () => {
    const element = document.createElement('div')
    element.textContent = 'SafeBank'

    document.body.append(element)

    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('SafeBank')

    element.remove()
  })

  it('supports bigint calculations without floating point', () => {
    const principal = 100_000_000n
    const aprBps = 200n
    const tenorDays = 180n

    const interest =
      (principal * aprBps * tenorDays) /
      (365n * 10_000n)

    expect(interest).toBe(986_301n)
  })
})
