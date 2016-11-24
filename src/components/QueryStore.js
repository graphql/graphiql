export default class QueryStore {
  constructor() {
    this.queries = this.load() || [];
  }

  get payload() {
    return {
      queries: this.queries
    }
  }

  save() {
    const payload = JSON.stringify(this.payload);
    localStorage.setItem('graphiql:queries', payload);
  }

  load() {
    const raw = localStorage.getItem('graphiql:queries');
    if (raw) {
      return JSON.parse(raw).queries;
    }
    return null;
  }

  fetchLatest() {
    return this.queries[this.queries.length - 1];
  }

  fetchSingle(index) {
    return this.queries[index];
  }

  fetchAll() {
    return this.queries;
  }

  push(query) {
    this.queries.push(query);
    this.save();
  }
}
