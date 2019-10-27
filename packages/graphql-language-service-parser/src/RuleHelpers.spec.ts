import { opt } from './RuleHelpers'

describe('opt', () => {
  it('should pass rule to `ofRule`', () => {
    expect(opt('string')).toEqual({ ofRule: 'string' })
  })
})

describe('list', () => {
  it('should build ', () => {
    expect(opt('string')).toEqual({ ofRule: 'string' })
  })
})
