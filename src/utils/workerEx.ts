export type Func = (...args: any[]) => any;
export type WorkerDependencies = Record<string, Func>;

const formatKey = (key: string) => {
  return key.replace(/\./g, "_");
};

/**
 * @description 提供了快捷方式独立某部分功能到Worker运行
 * @description 因worker和main上下文分开，目前是通过文本搜索生成worker代码，依赖需要全手动注入。
 * @description 当环境不支持worker时，会降级在主线程运行,这个过程是有副作用的,如果是同步函数会导致函数异步返回
 * @description_en Provide a shortcut to run some part of the code in a Worker
 * @description_en Because the worker and main context are separated, the worker code is currently generated by text search, 
 * and the dependencies need to be injected manually.
 * @description_en When the environment does not support workers, it will degrade to run in the main thread,
 * @example
 * ```
 * const pullMessage = async (msg: string) => {
 *   const result = await axios.request({ url: "https://api.com", method: "GET" });
 * }
 * const support = WorkerEx.checkWorkerSupport()
 * if(support){
 *   const pullWorker = new WorkerEx(pullMessage, { 'axios.request': axios.request })
 * }else{
 *   pullMessage()
 * }
 * ```
 */
export class WorkerEx<F extends Func> {
  //#region static
  static checkWorkerSupport() {
    const supportWorker = typeof Worker !== "undefined";
    const supportServiceWorker = typeof ServiceWorker !== "undefined";
    const isHttps = location.protocol === "https:";
    const isLocalhost = location.hostname === "localhost";
    const isElectron = navigator.userAgent.includes("Electron");
    return (
      supportWorker &&
      supportServiceWorker &&
      (isHttps || isLocalhost || isElectron)
    );
  }
  static WorkerChannel = {
    callDep: "_callDep",
    depResult: "_depResult",
    run: "_run",
    workerResult: "_workerResult",
  };
  static getId = ((tag = "id") => {
    let id = 0;
    return () => {
      if (id === Number.MAX_SAFE_INTEGER) {
        id = 0;
      }
      return tag + id++;
    };
  })("m");

  //#endregion
  private runTaskMap = new Map();
  private func: Func;
  private dependencies: WorkerDependencies;
  private worker!: Worker;
  private workerFuncName: string = "__worker__Func__";
  private workerEnv = `const taskMap = new Map();
const WorkerChannel = ${JSON.stringify(WorkerEx.WorkerChannel)}

const getId = ((tag = "id")=> {
  let id = 0;
  return () => {
    if (id === Number.MAX_SAFE_INTEGER) {
      id = 0;
    }
    return tag + id++;
  };
})()

async function callMainFuncDep(depName, args){
  const reqId = getId();
  globalThis.postMessage({
    type: WorkerChannel.callDep,
    reqId,
    payload:{
      depName,
      args
    }
  })
  return new Promise((resolve, reject) => {
    taskMap.set(reqId, { resolve, reject });
  });
}

self.addEventListener("message", async (e) => {
  const { type,payload,reqId } = e.data;
  if (type === WorkerChannel.depResult) {
    const task = taskMap.get(reqId);
    if (task) {
      task.resolve(payload);
      taskMap.delete(reqId);
    } else {
      console.log(taskMap, reqId)
      console.error("task not found:in worker", e.data);
    }
  }else if(type === WorkerChannel.run){
    try
    {
      const args = payload.args || [];
      const result = await ${this.workerFuncName}(...args)
      self.postMessage({
        type: WorkerChannel.workerResult,
        reqId,
        payload: result
      })
    }catch(e){
      console.error(e)
    }
  }
});
    `;
  constructor(func: F, dependencies: WorkerDependencies) {
    const support = WorkerEx.checkWorkerSupport();
    if (!support) {
      console.warn("WorkerEx is not supported in this environment");
    }
    this.func = func;
    this.dependencies = dependencies;
  }

  protected registerDependencies() {
    this.worker.addEventListener("message", async (e) => {
      const { type, payload, reqId } = e.data;
      if (type === WorkerEx.WorkerChannel.callDep) {
        const { depName, args } = payload;
        const dep = this.dependencies[depName];
        if (dep) {
          const result = await dep(...args);
          this.worker.postMessage({
            type: WorkerEx.WorkerChannel.depResult,
            reqId,
            payload: result,
          });
        }
      } else if (type === WorkerEx.WorkerChannel.workerResult) {
        const task = this.runTaskMap.get(reqId);
        if (task) {
          task.resolve(payload);
          this.runTaskMap.delete(reqId);
        } else {
          console.error("task not found:in main", e.data);
        }
      }
    });
  }

  protected buildDependencies() {
    const depStr = Object.keys(this.dependencies)
      .map((depName) => {
        return `
const ${formatKey(depName)} = async (...args) => {
  return callMainFuncDep("${depName}", args)
}
        `;
      })
      .join("\n");
    return depStr;
  }

  protected buildFunc() {
    /* 
      todo - Add `ast` to achieve code generation and intelligent dependency injection
    */
    const originFuncStr = this.func.toString();
    let asyncFunc: string = originFuncStr;
    asyncFunc = originFuncStr.startsWith("async")
      ? asyncFunc
      : `async ${asyncFunc}`;
    if (this.func.name) {
      this.workerFuncName = this.func.name;
    }
    asyncFunc = `const ${this.workerFuncName} = ${asyncFunc}`;
    Object.keys(this.dependencies).forEach((depName) => {
      const reg = new RegExp(`(await\\s*)?${depName}\\s*\\(`, "g");
      asyncFunc = asyncFunc.replace(reg, (match, p1) => {
        if (p1) {
          return match;
        } else {
          return `await ${formatKey(depName)}(`;
        }
      });
    });

    return asyncFunc;
  }

  /**
   * @description 初始化worker
   * @description_en Initialize worker
   */
  init() {
    if (WorkerEx.checkWorkerSupport() === false) {
      console.warn("Worker is not supported in this environment");
      return;
    }
    const depCode = this.buildDependencies();
    const funcCode = this.buildFunc();
    const code = `${depCode}
${funcCode}
${this.workerEnv}
`;

    const blob = new Blob([code], {
      type: "application/javascript",
    });
    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url);
    this.registerDependencies();
  }

  /**
   * @description 运行传入函数
   * @description_en Run the incoming function
   */
  async run(...args: Parameters<F>): Promise<ReturnType<F>> {
    if (WorkerEx.checkWorkerSupport() === false) {
      return this.func(...args);
    }
    if (!this.worker) {
      throw new Error("worker not init");
    }
    const reqId = WorkerEx.getId();
    this.worker.postMessage({
      type: WorkerEx.WorkerChannel.run,
      reqId,
      payload: { args },
    });
    return new Promise((resolve, reject) => {
      this.runTaskMap.set(reqId, { resolve, reject });
    });
  }

  destroy() {
    this.worker.terminate();
  }

  /**
   * @description 获取worker实例
   * @description_en Get worker instance
   */
  getWorker() {
    return this.worker;
  }
}
