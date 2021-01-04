import requests

url = "https://pje.trt15.jus.br/captcha/login_post.php"

payload={'random': 'fglnrlrsrndahs3vnigks1bak7',
'g-recaptcha-response': '03AGdBq269V5BxILKqFfthRVaGZcxFT4EQzf2ovgC1gX-gdJbXRpTiY2jiJ3t1-xoPdE0-FSbDKvVRpx9doG29XvRVJKVPMUc710L84QdaS4Z97CjzfgV-sNC18mGMnRaqq-UP1Pi2n1jVeuA-xnw4TQK0TV4kLkRLX9kvuZ-f-G21EWF8FqpWSR9AOS9Fg2ZXlzJ2LQcgLIg43tH0rK3QT5hGNBDYUn4eu2-MPa3FzEmywYGGdH4Rnmii-hzSflMNvecWcjcLY_bkTCKASdrkPthorouhUT3IpIHEWov3HElyefuh1R9ZB5av1pDO-9YGFaJldHs2jS2LsaqV1X0zNgy-Z3XBf7DWzFaAIJsZjOg2sWtr6VRERjeAWN6VjlmHcBBhejTg_M_W6WtsPfWyrlwaLwbRE8oPQsKyc8hHL3R7DwVDdAMwp_GGrypFM2aFljSgEYovxlWdht7PykuTA-HhW18j6Rv2plQ6PMNLETQPZjWkEWdMgJcD-JiXNhJhdlHh6dyUSlIYa-ZjEY18yQrPA8QNvN3StA',
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
  'Cookie': 'captchasess=hbvqlgth6vp0ichudeq5fkink0'
}

response = requests.request("POST", url, headers=headers, data=payload, files=files)

print(response.text)