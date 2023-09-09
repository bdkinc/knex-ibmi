import Transaction from "knex/lib/execution/transaction";
declare class IBMiTransaction extends Transaction {
    begin(connection: any): Promise<any>;
    rollback(connection: any): Promise<any>;
    commit(connection: any): Promise<any>;
}
export default IBMiTransaction;
