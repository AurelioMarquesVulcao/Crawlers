'use strict'

const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');


class downloadFiles {

    async download(name, link) {

        const url = link;

        const path = Path.resolve(__dirname, '../../downloads', name)

        const response = await Axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        })

        await console.log(!!Fs.createWriteStream(path));
        response.data.pipe(Fs.createWriteStream(path))

        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve()
            })
            response.data.on('error', err => {
                reject(err)
            })
        })
    }

}


// new downloadFiles().download('teste03.pdf', 'https://jte.trt15.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%27QjI/ylKKnoaDpir3SJ5CXTtT/DhfBGY2iGRUPYv2FK7wDCGkTBrN3gJh90f7HYwcsC1WNRmWj%2BvMZp3kl64s5NMp5jmbgKfyEBp8qzpf4dBKVK81yk6FsNY9cPTSDVBhZl1sY9xFgymXYmoXzs7KduvFwPbxrzI2P0rOfhg9ob7erlujU5ffNOIrdZF7J54A8KLZvrCHRM3JaEIiZZyUVD0KC2Hox6A/Lke12agSOgU%2BWLhXvbsEOuDSe4rPCyKSR7Egx0/49F7owtL%2BM1c0EJySqkRol7oABmzvYuUqhfknmsz0yK0Erp8nymxTZxa%2BfYSePZdv37yC8dq9e%2Bi5Ih8vtgn6TyGQ/g9hqLGs6iJhZckvG5v88fujJzKcsqsc7wjurC6ziv5FdJbKfNMo0cPWtTKvZJ7yej6kenMA4GaL3jbteyx6paKBSsan3qj1Wpt%2BU46u1R9AsAmr7M4giDTxG92ZRcoJ6KfTLzxHzQ8e9ExfyqVb2Os8hoKweAPRjgPD7dWtWNGkoBem4rRq2kF/37dvFTqKf3XkhFHxVPcEEp16nz4toCPDniBK4ElmacttxruHiuBDzE2G35TQL323fUJHD6El%2B6DRg1R%2Biro3Zlb6dDHsC0PL%2BqG44u7jGvm8MoZ2FFWQJOU4Y/NNfXg1VRxvZEokCAIwKvH1sbVcW/DoYiQRGJIgW1XI8ETDDIpd/i0dXBkOKLeK0nsU3Y6qfWCQKmSCWIc9FCcNjwH/%2Bo9kE26ZtotSmCRj1MWqYhqLY3Ay7Wja0iy31yYlhL2Tha7QeNwy2nByafPrHRgM%2B2Bq7CfvjIflNcTyht1eN39ejkExfR7Db9TOnclAqvPbNTorHj3eKmLwYAS2i3%2BzNcyMOymlfCNgmhfxS7OAoVy%2BT4INipS3JKocJwygShhVcCTYLoGaF2wRXoL2O2RmpLRJqOKgpt4sApAfihr0Lwb0sG0ih8YwEV30KikG/twGEnWsDmCmTfk/nYzTpwMKT4uwtVOpqIIpY/EijZbb9Fobaark9KXRLzfkU5Mj2LVPB3XzTiuLA/F2SPQFnZvvep0Mq3HsIL/889HHKj%2BpeUhmUqyRESMkE9qTXpXsnkf9E2Yz/smr1TkwlbpNdH2OM/JYi%2BgWbW8WNtkjwduTANV3Qvbd/Jpau6vrdfRD3QlY/JM9brI4xMDUAmNETWaKpL8MlE1C30vS5QspRSCav0jxzYpzZjvrqbaClzgbxA3AnZMj0t6qrCuiRnGjJYVvf9tK/Nudgi3SDPVI1Ulc16oGwqmIAngIw5pSPSA6QB1Kzhyt%2BEb/flcmTzWr9ug9FNfbF3AMNUPNaNvInuKIJ%2BxvrIF9vTXosJtXJfk1CNLdvJLTlsjn5ppTJOcXcJKi5M08STbMHE0qXmZWKzE9gU9FeJPQsaRPhQB%2BAY8odVLjWT/2HLGOtHZGgu9Uhne%2BzS47CXgfNwDV14z58SSMu2epEalXnLuJUWMBUBHWpsZaEHs2nCLljzCQZ01046gyaSQbArdsZqim3r3UegQ7uSH4xBCKKpKR%2BwKJKNRp0U5EZ9Ihi9f0m64Gx%2BHZWsE6Ub//UzGf%2BAOwKFOUdQ80i2S6YZ1eWOrflXaN31Gg80xIqTWpn%2B/UCkEXEnDRXNotRKJENLK4/GyRz/3o6s4e8VdtTjZ7qTnesRBCAspbXyuoJZ02IDuREhivyQu09f/sbnN7egPyoBk43n2OFjWwotADYXKSskwvAYBpHOMdaBhRUV2kYdE39fSruo15lZu/dxwwIcTfQg48YVqZaAr2KV3eKPpG0zomiycl2LrQ%2BFxAcgcOoR2DbCJZp9QZUONx8c7rherOKJWMv7hb9S61hsNqkbIzJhhlD/n8P3HmAMYUN0%2BDwOdneLq3/XSX5pGsV9/Eq6YZISlF/evBynfn%2BeeR8lblVOvs%2BuouFkFDpAKzeBrcvBAWzUht3w1ybBcSgZDR1liTxxWRry/RWWSfIh/0Jv8BWb2ypRsmrpO6SKsIz3iG0gxm3%2BwpI%2B2BHPOXkLPEXzAKryMZlcoUm1cI%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINVDqGc0Oi/wsG0GrvbAe2Cf%2B/Yxcdr/hHfFhhHMlkSZgCrRV2xZuNIRras3U62Co2Q==%27%22}&Host=jte.trt15.jus.br')
// new downloadFiles().download('teste04.pdf', 'https://jte.trt15.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%27QjI/ylKKnoaDpir3SJ5CXTtT/DhfBGY2iGRUPYv2FK7wDCGkTBrN3gJh90f7HYwcsC1WNRmWj%2BvMZp3kl64s5NMp5jmbgKfyEBp8qzpf4dBKVK81yk6FsNY9cPTSDVBhZl1sY9xFgymXYmoXzs7KduvFwPbxrzI2P0rOfhg9ob7erlujU5ffNOIrdZF7J54A8KLZvrCHRM3JaEIiZZyUVD0KC2Hox6A/Lke12agSOgU%2BWLhXvbsEOuDSe4rPCyKSR7Egx0/49F7owtL%2BM1c0EJySqkRol7oABmzvYuUqhfknmsz0yK0Erp8nymxTZxa%2BfYSePZdv37yC8dq9e%2Bi5Ih8vtgn6TyGQ/g9hqLGs6iJhZckvG5v88fujJzKcsqsc7wjurC6ziv5FdJbKfNMo0cPWtTKvZJ7yej6kenMA4GaL3jbteyx6paKBSsan3qj1Wpt%2BU46u1R9AsAmr7M4giDTxG92ZRcoJ6KfTLzxHzQ8e9ExfyqVb2Os8hoKweAPRjgPD7dWtWNGkoBem4rRq2kF/37dvFTqKf3XkhFHxVPcEEp16nz4toCPDniBK4ElmacttxruHiuBDzE2G35TQL323fUJHD6El%2B6DRg1R%2Biro3Zlb6dDHsC0PL%2BqG44u7jGvm8MoZ2FFWQJOU4Y/NNfXg1VRxvZEokCAIwKvH1sbVcW/DoYiQRGJIgW1XI8ETDDIpd/i0dXBkOKLeK0nsU3Y6qfWCQKmSCWIc9FCcNjwH/%2Bo9kE26ZtotSmCRj1MWqYhqLY3Ay7Wja0iy31yYlhL2Tha7QeNwy2nByafPrHRgM%2B2Bq7CfvjIflNcTyht1eN39ejkExfR7Db9TOnclAqvPbNTorHj3eKmLwYAS2i3%2BzNcyMOymlfCNgmhfxS7OAoVy%2BT4INipS3JKocJwygShhVcCTYLoGaF2wRXoL2O2RmpLRJqOKgpt4sApAfihr0Lwb0sG0ih8YwEV30KikG/twGEnWsDmCmTfk/nYzTpwMKT4uwtVOpqIIpY/EijZbb9Fobaark9KXRLzfkU5Mj2LVPB3XzTiuLA/F2SPQFnZvvep0Mq3HsIL/889HHKj%2BpeUhmUqyRESMkE9qTXpXsnkf9E2Yz/smr1TkwlbpNdH2OM/JYi%2BgWbW8WNtkjwduTANV3Qvbd/Jpau6vrdfRD3QlY/JM9brI4xMDUAmNETWaKpL8MlE1C30vS5QspRSCav0jxzYpzZjvrqbaClzgbxA3AnZMj0t6qrCuiRnGjJYVvf9tK/Nudgi3SDPVI1Ulc16oGwqmIAngIw5pSPSA6QB1Kzhyt%2BEb/flcmTzWr9ug9FNfbF3AMNUPNaNvInuKIJ%2BxvrIF9vTXosJtXJfk1CNLdvJLTlsjn5ppTJOcXcJKi5M08STbMHE0qXmZWKzE9gU9FeJPQsaRPhQB%2BAY8odVLjWT/2HLGOtHZGgu9Uhne%2BzS47CXgfNwDV14z58SSMu2epEalXnLuJUWMBUBHWpsZaEHs2nCLljzCQZ01046gyaSQbArdsZqim3r3UegQ7uSH4xBCKKpKR%2BwKJKNRp0U5EZ9Ihi9f0m64Gx%2BHZWsE6Ub//UzGf%2BAOwKFOUdQ80i2S6YZ1eWOrflXaN31Gg80xIqTWpn%2B/UCkEXEnDRXNotRKJENLK4/GyRz/3o6s4e8VdtTjZ7qTnesRBCAspbXyuoJZ02IDuREhivyQu09f/sbnN7egPyoBk43n2OFjWwotADYXKSskwvAYBpHOMdaBhRUV2kYdE39fSruo15lZu/dxwwIcTfQg48YVqZaAr2KV3eKPpG0zomiycl2LrQ%2BFxAcgcOoR2DbCJZp9QZUONx8c7rherOKJWMv7hb9S61hsNqkbIzJhhlD/n8P3HmAMYUN0%2BDwOdneLq3/XSX5pGsV9/Eq6YZISlF/evBynfn%2BeeR8lblVOvs%2BuouFkFDpAKzeBrcvBAWzUht3w1ybBcSgZDR1liTxxWRry/RWWSfIh/0Jv8BWb2ypRsmrpO6SKsIz3iG0gxm3%2BwpI%2B2BHPOXkLPEXzAKryMZlcoUm1cI%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINVCRp3A0fNZFDmWdvT5IAfDK1%2BJPzzVYxtzwySZCQC%2BHbbPjKAXM9dtEIAbA1Go8Sg==%27%22}&Host=jte.trt15.jus.br')


module.exports.downloadFiles = downloadFiles;
