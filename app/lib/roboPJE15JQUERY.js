var unirest = require('unirest');
var req = unirest('POST', 'https://pje.trt15.jus.br/captcha/login_post.php')
  .headers({
    'Origin': 'https://pje.trt15.jus.br',
    'Referer': 'https://pje.trt15.jus.br/consultaprocessual/',
    'sec-ch-ua-mobile': '?0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
    'Cookie': 'captchasess=bp0hkfot5qap9lq6508dfgj036'
  })
  .field('random', 'bp0hkfot5qap9lq6508dfgj036')
  .field('EVkShBIyxUNtQYeALcRjOmvsHfrbpTGWlKdZwqPCnDoM', 'aLJhAmjIXFtwesrGnBMfHQiUczgSCPRqWuvVdNkEYbD')
  // .field('', '')
  .field('g-recaptcha-response', '03AGdBq244xd29FEocdr9eBsBeohf2UNuwDyLBT0U_x3Nq03VHNubDYD_URmHRcl3kDR_xyQ8F8gNJzOk2nW99trtGYMrPYZyewiP5A0KhwCoPOAiBEElG_1aXbm7RxSrsz6Pu1mw67GRJPQrtdwS1z0EhsSOlzhskyPl2FPxoe79rOuyd8N-viZ-iuq6cCmAT-r1JBL_rka-NPimpmQV7vBiVVisvYhjK9iwyaloeMIw3hbe6R4sxFp9XQzKgqKe8biMp3jjzGRIKe27g1r9RS11q0Cu7GJtvHETiYG-4gl2s-YWs2eT8D_D-VOlctI58n1M7KoiO-IHpCPQiTb2vWshms8avrF61yLdaLUv39d7G4JzYalkgwgSbsypDu-j3zMOhHkE5iMNHB1Y965DAsunzrvPdoEczwpMboOEUL5Gymxjzc_CYAYjJO0sLhw6WblF55HK8bnf7wkU211xKFtZYMApf0u0BYXE7x2Y8XTnUMyZGGc7gYXk804H1ka0UQrLinZdxzVDV')
  .field('referer', '/consultaprocessual/')
  .end(function (res) { 
    if (res.error) throw new Error(res.error); 
    console.log(res.cookies);
  });
