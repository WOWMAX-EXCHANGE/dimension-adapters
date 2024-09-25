import BigNumber from "bignumber.js";
import request, { gql } from "graphql-request";
import { FetchOptions, SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";

const endpoint =
  "https://api.goldsky.com/api/public/project_cm0qvthsz96sp01utcnk55ib0/subgraphs/filament-sei/v1/gn";

const queryDaily = gql`
  query stats($from: String!, $to: String!) {
    totalTradingFees(
      where: {
        timestamp_gte: $from
        timestamp_lte: $to
      }
    ) {
      timestamp_
      block_number
      account
      totalFees
    }
  }
`;
const queryTotal = gql`
  query stats($from: String!, $to: String!) {
    totalTradingFees(
      where: {
        timestamp_gte: $from
        timestamp_lte: $to
      }
    ) {
      timestamp_
      block_number
      account
      totalFees
    }
  }
`;

interface IGraphResponse {
  totalTradingFees: Array<{
    timestamp: string;
    blocknumber: string;
    account: string;
    totalFees: string;
  }>;
}

const methodology = {
  totalFees: "Tracks the cumulative fees (borrowing fees + trading fees) generated by all transactions.",
  dailyFees: "Tracks the fees (borrowing fees + trading fees) generated by transactions on a daily basis.",
};

const toString = (x: BigNumber) => {
  if (x.isEqualTo(0)) return undefined;
  return x.toString();
};

const fetchProtocolFees = async ({
  endTimestamp,
  startTimestamp,
}: FetchOptions) => {
  // Ensure startTimestamp and endTimestamp are defined
  console.log(startTimestamp)
  console.log(endTimestamp)
  if (!startTimestamp || !endTimestamp) {
    throw new Error("startTimestamp and endTimestamp must be provided");
  }

  // Fetch daily fees
  const responseDaily: IGraphResponse = await request(endpoint, queryDaily, {
    from: String(startTimestamp),
    to: String(endTimestamp),
  });

  let dailyFees = new BigNumber(0);
  responseDaily.totalTradingFees.forEach((data) => {
    dailyFees = dailyFees.plus(new BigNumber(data.totalFees));
  });

  // Fetch total fees
  const responseTotal: IGraphResponse = await request(endpoint, queryTotal, {
    from: String(startTimestamp),
    to: String(endTimestamp),
  });

  let totalFees = new BigNumber(0);
  responseTotal.totalTradingFees.forEach((data) => {
    totalFees = totalFees.plus(new BigNumber(data.totalFees));
  });

  dailyFees = dailyFees.dividedBy(new BigNumber(1e18));
  totalFees = totalFees.dividedBy(new BigNumber(1e18));

  const _dailyFees = toString(dailyFees);
  const _totalFees = toString(totalFees);

  return {
    dailyFees: _dailyFees ?? "0",
    totalFees: _totalFees ?? "0",
  };
};

const adapter: SimpleAdapter = {
  adapter: {
    [CHAIN.SEI]: {
      fetch: fetchProtocolFees,
      start: 1725741586,
      meta: {
        methodology,
      },
    },
  },
};
export default adapter;
