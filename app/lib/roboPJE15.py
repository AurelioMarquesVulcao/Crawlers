import requests

url = "https://pje.trt15.jus.br/captcha/login_post.php"

payload={'random': 'hkq2vqvm7fafmts9houmcceso6',
# 'aRmehzkbJxsWLpGQZHoUduXjE': "BzasEviYuWyQM",
# 'hNylabpcwUoFBCZtPuVJgzvQrXLnde': "Geysj",
'g-recaptcha-response': '03AGdBq27JU-g-ShJonk9lrNRc1JXdwzRqzaIQbMxvc_u1uy4ZWS_bZ_qPHnwkYPauZqu24DwLqag86KtqaqFJjeW0vDKwwlEu3oyN0qvtpTVktP5SdDbsnr5DTpdky4vcgLvpwBVIY0Cqm393Ii8q1OOD7V4byIB_2N9clMUOo9IClU0Coz-1DcLMZ0lXtShM7B0tWkl6IL9uLjq1VPtN_XU9OlJjr2y-gbqbOSdtZkaptdjIHWunH5V1QDz3YKlWNYJrJ5iNdsjSAKIBnHwgg1L-ZNngtqT9OaSqX5MdrBxn0gjY2PcKbdvhF5HAmYVLFYV_1vVvE9RbjV0EsDNMBp6y1MSLGANsdGaTSVumpOYt5r5pplu0lydd1gAC36bLkuCG-rGxHv9FwzEf5Prrq7W9CtTpqgTM7yu1SzWa4_DPqlnXL0TmmgOJvqrAMwKooLsG5jmwFfqlJ5vUmk6YQgZJZAiu-crXrHuSRcNzc8htXgT8r4_TXrZpOXflRr_OUf5S7E8CEFq76eRv-8B4ZjJ5liLTxyY3Yw',
'referer': '/consultaprocessual/'}
files=[

]
headers = {
  'Origin': 'https://pje.trt15.jus.br',
  'Referer': 'https://pje.trt15.jus.br/consultaprocessual/',
  'sec-ch-ua-mobile': '?0',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
  'Cookie': 'captchasess=hkq2vqvm7fafmts9houmcceso6'
}

response = requests.request("POST", url, headers=headers, data=payload, files=files)

print(response.text.encode('ascii', 'ignore').decode('ascii'))