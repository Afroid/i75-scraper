import { handler } from './handler';
import { fetchMLBScores } from './fetchers/mlbFetcher';
import { storeLatest } from './storage/s3Client';

jest.mock('./fetchers/mlbFetcher');
jest.mock('./storage/s3Client');

const mockFetch = fetchMLBScores as jest.MockedFunction<typeof fetchMLBScores>;
const mockStore = storeLatest as jest.MockedFunction<typeof storeLatest>;

describe('handler', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 200 when fetch and store succeed', async () => {
    mockFetch.mockResolvedValue({ A: 1, B: 2 });
    mockStore.mockResolvedValue();

    const result = await handler();

    // Assertions
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockStore).toHaveBeenCalledWith('mlb', { A: 1, B: 2 });
  });

  it('returns 500 when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Fetch error'));

    const result = await handler();

    // Assertions
    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Error fetching scores' }),
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockStore).not.toHaveBeenCalled();
  });

  it('returns 500 when storeLatest throws', async () => {
    // Fetch succeeds
    mockFetch.mockResolvedValue({ A: 1, B: 2 });
    // but store fails
    mockStore.mockRejectedValue(new Error('Store error'));

    const result = await handler();

    // Assertions
    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Error storing scores' }),
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockStore).toHaveBeenCalledWith('mlb', { A: 1, B: 2 });
  });
});
