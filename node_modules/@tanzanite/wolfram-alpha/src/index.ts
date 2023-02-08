import https from "https";
import querystring from "querystring";

const baseApiUrl = "https://api.wolframalpha.com/";
const createApiParamsRejectMsg = "method only receives string or object";

/**
 * We support four 'output' formats:
 * 'string' and 'xml' are both strings,
 * 'json' is an Object (a result of JSON.parse), and
 * 'image' is a string of a "Data URI"
 */
type OutputFormat = "string" | "json" | "image" | "xml";

/**
 * @example {url: 'https://api.wolframalpha.com/v1/result?appid=DEMO&i=2%2B2', output: 'string'}
 */
export interface FetchParams {
	/**
	 * full URL of api call
	 */
	url: string;

	/**
	 * which OutputFormat do we want?
	 */
	output: OutputFormat;
}

/**
 * @example
 * ```
 * {
 * 	data: '4',
 * 	output: 'string',
 * 	statusCode: 200,
 * 	contentType: 'text/plain;charset=utf-8'
 * }
 * ```
 */
export interface FormatParams {
	/**
	 * data returned by fetchResults
	 */
	data: string;

	/**
	 * which OutputFormat do we want?
	 */
	output: OutputFormat;

	/**
	 * HTTP status code of fetchResults
	 */
	statusCode: number;

	/**
	 * HTTP content-type header from fetchResults
	 */
	contentType: string;
}

type DataURI = string;

/**
 * Build a URL call from a baseUrl and input; specify an OutputFormat (for fetchResults).
 * @param baseUrl - base URL of API we are trying to call
 * @param input - string of query, or object of parameters
 * @param output - which OutputFormat we want
 * @example
 * // resolves {url: 'https://api.wolframalpha.com/v1/result?appid=DEMO&i=2%2B2', output: 'string'}
 * createApiParams('https://api.wolframalpha.com/v1/result?appid=DEMO', '2+2', 'string')
 * // resolves {
 * //   url: 'https://api.wolframalpha.com/v1/simple?appid=DEMO&i=nyc%20to%la&units=metric',
 * //   output: 'image'
 * // }
 * createApiParams(
 * 	'https://api.wolframalpha.com/v1/simple?appid=DEMO',
 * 	{ i: 'nyc to la', units: 'metric' },
 * 	'image'
 * )
 * // rejects TypeError('method only receives string or object')
 * createApiParams('https://api.wolframalpha.com/v1/result?appid=DEMO')
 */
async function createApiParams(
	baseUrl: string,
	input: string | Record<string, string | number | boolean | undefined>,
	output: OutputFormat = "string"
): Promise<FetchParams> {
	switch (typeof input) {
		case "string":
			return { url: `${baseUrl}&i=${encodeURIComponent(input)}`, output };
		case "object":
			return { url: `${baseUrl}&${querystring.stringify(input)}`, output };
		default:
			throw new TypeError(createApiParamsRejectMsg);
	}
}

/**
 * Return a Promise that downloads params.url, and resolves the results (for formatResults).
 * @param params
 * @example
 * // resolves { data: '4', output: 'string', statusCode: 200,
 * //            contentType: 'text/plain;charset=utf-8' }
 * fetchResults({
 *   url: 'https://api.wolframalpha.com/v1/result?appid=DEMO&i=2%2B2',
 *   output: 'string'
 * })
 * // resolves { output: 'json', statusCode: 200, contentType: 'text/plain;charset=utf-8',
 * //            data: '{"queryresult" : {\n\t"success" : true, \n\t"error" : false, \n\t"nu...', }
 * fetchResults({
 *   url: 'https://api.wolframalpha.com/v2/query?appid=DEMO&input=2%2B2&output=json',
 *   output: 'json'
 * })
 * // resolves { output: 'image', statusCode: 200, contentType: 'image/gif',
 * //            data: 'R0lGODlhHAJNBfcAAAAAAAAEAAgICAgMCBAQEBAUEBgYGBgcGCAgICAkICksKSkoKTEwMT...'}
 * fetchResults({
 *   url: 'https://api.wolframalpha.com/v1/simple?appid=DEMO&i=nyc%20to%la&units=metric',
 *   output: 'image'
 * })
 * // resolves { output: 'image', statusCode: 501, contentType: 'text/plain;charset=utf-8',
 * //            data: 'Wolfram|Alpha did not understand your input' }
 * fetchResults({
 *   url: 'https://api.wolframalpha.com/v1/result?appid=DEMO&i=F9TVlu5AmVzL'
 *   output: 'string'
 * })
 */
function fetchResults(params: FetchParams): Promise<FormatParams> {
	const { url, output } = params;
	return new Promise((resolve, reject) => {
		https
			.get(url, res => {
				const statusCode = res.statusCode;
				const contentType = res.headers["content-type"];
				if (output === "image" && statusCode === 200) {
					res.setEncoding("base64"); // API returns binary data, we want base64 for the Data URI
				} else {
					res.setEncoding("utf8");
				}
				let data = "";
				res.on("data", chunk => {
					data += chunk;
				});
				res.on("end", () => {
					resolve({ data, output, statusCode: statusCode!, contentType: contentType! });
				});
			})
			.on("error", e => {
				reject(e);
			});
	});
}

/**
 * Return a Promise that resolves a formatted form of params.data, as specified by
 * params.output, params.statusCode, and params.contentType
 * @param params
 * @example
 * // resolves "4"
 * formatResults({
 *   data: '4', output: 'string', statusCode: 200,
 *   contentType: 'text/plain;charset=utf-8'
 * })
 * // resolves {success: true, error: false, numpods: 6, datatypes: 'Math', timedout: '' ...}
 * formatResults({
 *   data: '{"queryresult" : {\n\t"success" : true, \n\t"error" : false, \n\t"nu...',
 *   output: 'json', statusCode: 200, contentType: 'text/plain;charset=utf-8'
 * })
 * // resolves 'data:image/gif;base64,R0lGODlhHAJNBfcAAAAAAAAEAAgICAgMCBAQEBAUEBgYGBgcGCAgICAkIC...
 * formatResults({
 *   data: 'R0lGODlhHAJNBfcAAAAAAAAEAAgICAgMCBAQEBAUEBgYGBgcGCAgICAkICksKSkoKTEwMT...'
 *   output: 'image', statusCode: 200, contentType: 'image/gif'
 * })
 * // rejects Error('Wolfram|Alpha did not understand your input')
 * formatResults({
 *   data: 'Wolfram|Alpha did not understand your input'
 *   output: 'image', statusCode: 501, contentType: 'text/plain;charset=utf-8'
 * })
 */
async function formatResults(params: FormatParams): Promise<Record<string, string | number | boolean> | string> {
	const { data, output, statusCode, contentType } = params;
	if (statusCode === 200) {
		switch (output) {
			case "json":
				try {
					return JSON.parse(data).queryresult;
				} catch (e) {
					throw new Error("Temporary problem in parsing JSON, please try again.");
				}
			case "image":
				return `data:${contentType};base64,${data}`;
			default:
				return data;
		}
		// if (statusCode !== 200)...
	} else if (/^text\/html/.test(contentType)) {
		// Rarely, there may be a catastrophic error where the API gives an HTML error page.
		throw new Error("Temporary problem with the API, please try again.");
	} else {
		// This runs if non-full API input is empty, ambiguous, or otherwise invalid.
		throw new Error(data);
	}
}

/**
 * Wolfram|Alpha API NPM Library
 */
export class WolframAlphaAPI {
	public appid: string;

	/**
	 * You may get your 'appid' at {@link https://developer.wolframalpha.com/portal/myapps/}.
	 * Remember, this appID must be kept secret.
	 * @param appid - the appid, must be non-empty string.
	 * @throws TypeError
	 * @example
	 * const WolframAlphaAPI = require('wolfram-alpha-api');
	 * const waApi = WolframAlphaAPI('DEMO-APPID');
	 */
	constructor(appid: string) {
		if (!appid || typeof appid !== "string") {
			throw new TypeError("appid must be non-empty string");
		}
		this.appid = appid;
	}

	/**
	 * Takes 'input' (which is either a string, or an object of parameters), runs it through
	 * the Wolfram|Alpha Simple API, and returns a Promise that
	 * resolves a string of a "Data URI", or rejects if there's an error.
	 * @param input - string or object of parameters
	 * @see https://products.wolframalpha.com/simple-api/documentation/
	 * @example
	 * // "data:image/gif;base64,R0lGODlhHAK5AvcAAAAAAAAEAAgICAgMCBAQEBAUEBsdGzE0MTk8OTk4OS0uLSAkI...
	 * waApi.getSimple('2+2').then(console.log, console.error);
	 * // "data:image/gif;base64,R0lGODlhHAJNBfcAAAAAAAAEAAgICAgMCBAQEBAUEBgYGBgcGCAgICAkICksKSkoK...
	 * waApi.getSimple({i: 'nyc to la', units: 'metric'}).then(console.log, console.error);
	 * // Error: Wolfram|Alpha did not understand your input
	 * waApi.getSimple('F9TVlu5AmVzL').then(console.log, console.error);
	 * // TypeError: method only receives string or object
	 * waApi.getSimple().then(console.log, console.error);
	 */
	public async getSimple(input: string | Record<string, string | number | boolean | undefined>): Promise<DataURI> {
		const baseUrl = `${baseApiUrl}v1/simple?appid=${this.appid}`;
		const params = await createApiParams(baseUrl, input, "image");
		const results = await fetchResults(params);
		return formatResults(results) as Promise<string>;
	}

	/**
	 * Takes 'input' (which is either a string, or an object of parameters), runs it through
	 * the Wolfram|Alpha Short Answers API, and returns a Promise that
	 * resolves a string of results, or rejects if there's an error.
	 * @param input - string or object of parameters
	 * @see https://products.wolframalpha.com/short-answers-api/documentation/
	 * @example
	 * // "4"
	 * waApi.getShort('2+2').then(console.log, console.error);
	 * // "3966 kilometers"
	 * waApi.getShort({i: 'nyc to la', units: 'metric'}).then(console.log, console.error);
	 * // Error: Wolfram|Alpha did not understand your input
	 * waApi.getShort('F9TVlu5AmVzL').then(console.log, console.error);
	 * // TypeError: method only receives string or object
	 * waApi.getShort().then(console.log, console.error);
	 */
	public async getShort(input: string | Record<string, string | number | boolean | undefined>): Promise<string> {
		const baseUrl = `${baseApiUrl}v1/result?appid=${this.appid}`;
		const params = await createApiParams(baseUrl, input);
		const results = await fetchResults(params);
		return formatResults(results) as Promise<string>;
	}

	/**
	 * Takes 'input' (which is either a string, or an object of parameters), runs it through
	 * the Wolfram|Alpha Spoken Results API, and returns a Promise that
	 * resolves a string of results, or rejects if there's an error.
	 * @param input - string or object of parameters
	 * @see https://products.wolframalpha.com/spoken-results-api/documentation/
	 * @example
	 * // "The answer is 4"
	 * waApi.getSpoken('2+2').then(console.log, console.error);
	 * // "The answer is about 3966 kilometers"
	 * waApi.getSpoken({i: 'nyc to la', units: 'metric'}).then(console.log, console.error);
	 * // Error: Wolfram Alpha did not understand your input
	 * waApi.getSpoken('F9TVlu5AmVzL').then(console.log, console.error);
	 * // TypeError: method only receives string or object
	 * waApi.getSpoken().then(console.log, console.error);
	 */
	public async getSpoken(input: string | Record<string, string | number | boolean | undefined>): Promise<string> {
		const baseUrl = `${baseApiUrl}v1/spoken?appid=${this.appid}`;
		const params = await createApiParams(baseUrl, input);
		const results = await fetchResults(params);
		return formatResults(results) as Promise<string>;
	}

	/**
	 * Takes 'input' (which is either a string, or an object of parameters), runs it through
	 * the Wolfram|Alpha Full Results API, and returns a Promise that
	 * either resolves an Object or a string of XML, or rejects if there's an error.
	 * @param input - string or object of parameters
	 * @see https://products.wolframalpha.com/api/documentation/
	 * @example
	 * // {success: true, error: false, numpods: 6, datatypes: 'Math', timedout: '', timing: 1.08 ...
	 * waApi.getFull('2+2').then(console.log, console.error);
	 * // "<queryresult success='true' error='false' numpods='7' ...
	 * waApi.getFull({input:'nyc to la', output:'xml'}).then(console.log, console.error);
	 * // { success: false, error: false, numpods: 0, datatypes: '', timedout: '', ...
	 * waApi.getFull('F9TVlu5AmVzL').then(console.log, console.error)
	 * // TypeError: method only receives string or object
	 * waApi.getFull().then(console.log, console.error);
	 */
	public async getFull(
		input: string | Record<string, string | number | boolean | undefined>
	): Promise<Record<string, string | number | boolean> | string> {
		const baseUrl = `${baseApiUrl}v2/query?appid=${this.appid}`;
		// This promise works just like createApiParams, except with a bit more processing
		const params = ((): FetchParams => {
			switch (typeof input) {
				case "string":
					return {
						url: `${baseUrl}&input=${encodeURIComponent(input)}&output=json`,
						output: "json"
					};
				case "object": {
					// the API defaults to XML, but we want to default to JSON.
					const options = Object.assign({ output: "json" }, input);
					// since all other APIs use 'i' instead of 'input', allow for 'i'.
					if (options.input == null && options.i != null) {
						options.input = options.i;
						delete options.i;
					}
					return {
						url: `${baseUrl}&${querystring.stringify(options)}`,
						output: options.output as OutputFormat
					};
				}
				default:
					throw new TypeError(createApiParamsRejectMsg);
			}
		})();
		const results = await fetchResults(params);
		return formatResults(results);
	}
}

/**
 * You may get your 'appid' at {@link https://developer.wolframalpha.com/portal/myapps/}.
 * Remember, this appID must be kept secret.
 * @param appid - the appid, must be non-empty string.
 * @throws TypeError
 * @example
 * const WolframAlphaAPI = require('wolfram-alpha-api');
 * const waApi = WolframAlphaAPI('DEMO-APPID');
 */
export function initializeClass(appid: string) {
	return new WolframAlphaAPI(appid);
}

export default initializeClass;
