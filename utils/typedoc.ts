import { execSync as x } from "child_process";
import * as fs from "fs";
import { JSONOutput, ReflectionKind } from "typedoc";

console.log("Generating typedoc...");
x(
  `cd ../stacks.js && npx typedoc --json out.json && mv out.json ../docs/out.json`
);

console.log("Parsing typedoc...");
const json = fs.readFileSync("out.json", "utf8");
const data = JSON.parse(json) as JSONOutput.ProjectReflection;

const modules: JSONOutput.DeclarationReflection[] = [];
const byId: Record<string, JSONOutput.DeclarationReflection> = {};

function walkChildren(ref: JSONOutput.ContainerReflection) {
  byId[ref.id] = ref as JSONOutput.DeclarationReflection;

  if (ref.variant === "declaration" && ref.kind === ReflectionKind.Module) {
    modules.push(ref as JSONOutput.DeclarationReflection);
  }

  if (!ref.children) return;
  for (const child of ref.children) {
    // console.log(`Child name: ${child.name}, Kind: ${child.kind}`);
    walkChildren(child);
  }
}

walkChildren(data);

console.log("modules", modules.length);

const DEFAULT_GROUPS = [
  "Classes",
  "Interfaces",
  "Type Aliases",
  "Variables",
  "Functions",
  "Enumerations",
  "Namespaces",
];

modules
  .filter((m) => m.name === "@stacks/network")
  .forEach((m) => {
    let mdx = "";
    const filename = `${m.name.split("/")[1]}.generated.mdx`;

    mdx += `---
title: ${m.name.split("/")[1]}
toc: false
---

import { Root, API, APIExample } from '@/components/layout';
import { Property } from 'fumadocs-ui/components/api'
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { InlineCode } from '@/components/inline-code';

<Root>
<API className='my-20'>
`;

    if (m.groups) {
      const used = new Set();

      m.groups
        .filter((g) => !DEFAULT_GROUPS.includes(g.title))
        .forEach((g) => {
          console.log("Group:", g.title);
          mdx += `
<div className="flex-1">
<h2 className="mt-0">${g.title}</h2>
`;

          g.children?.forEach((cId) => {
            if (used.has(cId)) return;

            const c = byId[cId];
            console.log("Child:", cId, c);
            // console.log("Child:", c.comment?.summary);
            console.log("Child:", c.comment?.blockTags);
            // todo: @related

            // todo: badge for ts kind
            mdx += `
### \`${c.name}\`

${c.comment?.summary.reduce((acc, part) => acc + "\n" + part.text, "\n")}
`;

            // todo: implement recursively with level param
            // todo: signatures are also ids but not in children
            //             c.groups?.forEach((g) => {
            //               mdx += `
            // #### ${g.title}
            // `;

            //               console.log(" - Group:", g);
            //               g.children?.forEach((cId) => {
            //                 const c = byId[cId];
            //                 console.log(" - Child:", c);

            //                 mdx += `
            // - \`${c.name}\``;
            //               });
            //             });

            mdx += `
### Options

<Property required={false} deprecated={false} name={"url"} type={"string"}>

The base URL of your node/API.

<span>Default: \`"https://api.hiro.so"\`</span>

</Property>

<Property required={false} deprecated={false} name={"fetch"} type={"function"}>

A custom function for \`fetch\` compatible network requests. This can be used to override headers or create more complex modifications to the requests made via Stacks.js methods.

</Property>
`;

            const examples = c.comment?.blockTags
              ?.map((block) => {
                console.log("Block:", block);

                const content = block.content.slice();
                const title = content.shift();
                return { title, content, tag: block.tag };
              })
              .filter((block) => block.tag === "@example");

            mdx += `
</div>
<APIExample>

<Tabs defaultValue="${examples?.[0]?.title?.text.trim()}">
  <TabsList className='flex flex-wrap'>`;

            examples?.forEach((example) => {
              mdx += `
<TabsTrigger value="${example.title?.text.trim()}" className='tab group'>
  <Badge variant='outline' className='badge transition-colors hover:text-neutral-900 dark:group-hover:text-white'>${example.title?.text.trim()}</Badge>
</TabsTrigger>
`;
            });

            examples?.forEach((example) => {
              mdx += `
<TabsContent value="${example.title?.text.trim()}">
  ${example.content.map((part) => part.text).join("\n")}
</TabsContent>
`;
            });

            mdx += `
</TabsList>
</Tabs>
</APIExample>
`;

            used.add(cId);
          });
        });
    }

    mdx += `
</API>
</Root>
`;

    console.log("Writing to:", filename);
    fs.writeFileSync(`content/docs/stacks/stacks.js/packages/${filename}`, mdx);
  });
