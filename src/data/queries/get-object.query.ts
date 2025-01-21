const getObjectQuery = (address: string): string => {
	return `
		query GetObject {
			object(address: "${address}") {
				version
				storageRebate
				asMoveObject {
					contents {
						json
					}
				}
			}
		}
	`;
};
