declare module 'oai-pmh2' {
	export interface IOaiPmhOptions {
		userAgent?: string;
		/** Whether to retry on 503. Defaults to `true`. */
		retry?: boolean;
		/** Number of retries. Only used if {@link IOaiPmhOptions.retry} is `true`. */
		retryMax?: number;
	}
	export interface IRecordsQueryOptions {
		metadataPrefix: string,
		set?: string,
		from?: string,
		until?: string
	}
	export class OaiPmhError extends Error {}
	export class OaiPmh {
		constructor( baseUrl: string, options?: IOaiPmhOptions );

		public identify(): Promise<any>;
		public listIdentifiers(options: IRecordsQueryOptions): AsyncGenerator<any>;
		public listRecords(options: IRecordsQueryOptions): AsyncGenerator<any>;
		public listMetadataFormats(options?: {identifier?: string}): Promise<any>;
		public listSets(): AsyncGenerator<any>;
		public getRecord( identifier: string, metadataPrefix: string ): Promise<unknown>
	}
}
