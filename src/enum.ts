import { EnumItem } from './enum-item';
import { EnumLoadHandlerBase } from './load-handler-base';
import { EnumLoadHandlerContext } from './load-handler-context';

export class Enum<T extends EnumItem> {
    private m_Reduce: Promise<{ [key: string]: any; }>;

    private m_AllItem: Promise<{ [no: number]: T; }>;
    public get allItem() {
        this.m_AllItem ??= new Promise<{ [no: number]: T; }>(async (s, f) => {
            try {
                const ctx: EnumLoadHandlerContext = {
                    app: this.m_App,
                    areaNo: this.m_AreaNo,
                    enum: this,
                    res: {},
                };
                await this.m_LoadHandler.handle(ctx);
                s(ctx.res);
            } catch (ex) {
                f(ex);
            }
        });
        return this.m_AllItem;
    }

    public get items() {
        return new Promise<T[]>(async (s, f) => {
            try {
                const allItem = await this.allItem;
                s(
                    Object.values(allItem)
                );
            } catch (ex) {
                f(ex);
            }
        });
    }

    public constructor(
        public name: string,
        private m_App: string,
        private m_AreaNo: number,
        private m_LoadHandler: EnumLoadHandlerBase,
        private m_ReduceFunc: { [key: string]: (memo: any, item: T) => any; },
    ) { }

    public async get(predicate: (entry: T) => boolean) {
        const items = await this.items;
        return items.find(r => {
            return predicate(r);
        });
    }

    public async getReduce<TReduce>(typer: string) {
        this.m_Reduce ??= new Promise<{ [key: string]: any; }>(async (s, f) => {
            try {
                const items = await this.items;
                s(
                    Object.entries(this.m_ReduceFunc).reduce((memo, [k, v]) => {
                        memo[k] = items.reduce((memo, r) => {
                            return v(memo, r);
                        }, {});
                        return memo;
                    }, {})
                );
            } catch (ex) {
                return f(ex);
            }
        });

        const reduce = await this.m_Reduce;
        return reduce[typer] as TReduce;
    }
}