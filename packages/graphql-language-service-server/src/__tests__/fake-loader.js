import {buildSchema} from 'graphql'

module.exports = {
  init: () => {
    return {
      getSchema: () => buildSchema(`type Test {id:ID}`)
    }
  }
}
