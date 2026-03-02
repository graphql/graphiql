'# this snippet requires the requests library which can be installed
'# via pip with the command: pip install requests
import requests

base_url = 'https://api.kivaws.org/graphql?query=`

graphql_query = "{lend {loan (id: 1568001){id name}}}"

r = requests.post(base_url+ graphql_query )
r.json()
