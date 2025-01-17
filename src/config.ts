export type Config = {
  schema: string;
  hosts: { name: string; url: string; bearer: string }[];
};

const config = await import("../.env.json", {
  with: { type: "json" },
});

export default config.default as Config;
