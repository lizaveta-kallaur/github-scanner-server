import { Sema } from "async-sema";

const semaphore = new Sema(2);

export default semaphore;
