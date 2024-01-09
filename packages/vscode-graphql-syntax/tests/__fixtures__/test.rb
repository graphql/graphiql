it "Should find datasets by ransack" do
    dataset = Dataset.last
    query = <<~GRAPHQL
    {
        datasets(q: { idEq: 3 }) { id, daylight }
    }
    GRAPHQL
    data = Util.graphql_query(query)
    expect(data['datasets'][0]["daylight"]).to eq dataset.daylight

    query2 = <<-GRAPHQL
    {
        datasets(q: { idEq: #{dataset.id} }) { id, daylight }
    }
    GRAPHQL

    query3 = <<~'GRAPHQL'
    {
        datasets(q: { idEq: #{dataset.id} }) { id, daylight }
    }
    GRAPHQL
end
