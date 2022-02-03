import { create } from 'ipfs-http-client'

const bearerToken =
	'Basic ' +
	Buffer.from('24cRpeTV3Od57ZmO3KBfPuKy5XJ:114e178af52a89aeaf56765beac8ec8e').toString('base64')

// Development (Local)
const localNode = '/ip4/127.0.0.1/tcp/5001'

// Production (Infura)
const infuraNode = {
	host: 'ipfs.infura.io',
	port: 5001,
	protocol: 'https',
	headers: {
		authorization: bearerToken,
	},
	apiPath: '/api/v0',
}

const ipfsClientConfig = process.env.NODE_ENV === 'production' ? infuraNode : localNode
const ipfsClient = create(ipfsClientConfig)

export default ipfsClient
