/** Plugin identity for cordis.yml rows. */
declare const name = "dsh-workspace-groups-anim";
/** Services required before mounting: the webserver route. */
declare const inject: string[];
/** Plugin body: mount the config snapshot route and the overlay write route. */
declare function apply(ctx: any): void;
export { apply, inject, name };
