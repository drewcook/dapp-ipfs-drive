import { create } from 'ipfs-http-client'

import crypto from 'crypto'

const hash = crypto.createHmac(
	'sha256',
	'4ba4e5e0fc174cb4943e195f8b0623a9',
	process.env.SHA_HASH_SECRET,
)
console.log(hash)

const projectId = process.env.REACT_APP_INFURA_IPFS_PROJECT_ID
const projectSecret = process.env.REACT_APP_INFURA_IPFS_PROJECT_SECRET
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')

// Development (Local)
const localNode = '/ip4/127.0.0.1/tcp/5001'

// Production (Infura)
const infuraNode = {
	host: 'ipfs.infura.io',
	port: 5001,
	protocol: 'https',
	headers: {
		authorization: auth,
	},
}

const ipfsClientConfig = process.env.NODE_ENV === 'production' ? infuraNode : localNode
console.log({ ipfsClientConfig })
const ipfsClient = create(ipfsClientConfig)

export default ipfsClient
