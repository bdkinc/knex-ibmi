import { Knex } from "knex";
// @ts-ignore
import Transaction from "knex/lib/execution/transaction";

class TransactionDB2 extends Transaction<Knex.Transaction> {}

export default TransactionDB2;
