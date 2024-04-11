import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { Card, Cards } from "fumadocs-ui/components/card";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { utils, type Page } from "@/utils/source";
import { createMetadata } from "@/utils/metadata";
import Preview from "@/components/preview";

interface Param {
  slug: string[];
}

export const dynamicParams = false;

export default function Page({ params }: { params: Param }): JSX.Element {
  const page = utils.getPage(params.slug);

  if (!page) notFound();

  const path = `content/docs/${page.file.path}`;
  const preview = page.data.preview;

  // TODO: this is a less than ideal solution for creating different titles between sidebar and page
  const generatePrefix = (page: any) => {
    // Mapping of words to their desired capitalization forms
    const specialCases = {
      api: "API",
      sdk: "SDK",
    };

    if (page.file?.name === "index" && page.slugs[1]) {
      const segment = page.slugs[1];
      return (
        specialCases[segment.toLowerCase() as keyof typeof specialCases] ||
        segment.charAt(0).toUpperCase() + segment.slice(1)
      );
    } else if (["overview", "index"].includes(page.file?.name)) {
      const pathSegments = page.file.dirname.split("/");
      if (pathSegments.length >= 2) {
        const relevantSegments = pathSegments.slice(-2); // Get the last two segments
        return relevantSegments
          .map(
            (segment: string) =>
              specialCases[
                segment.toLowerCase() as keyof typeof specialCases
              ] || segment.charAt(0).toUpperCase() + segment.slice(1) // Capitalize the first letter
          )
          .join(" "); // Join them with a space
      }
    }
    return "";
  };

  const prefix = generatePrefix(page);

  return (
    <DocsPage
      toc={page.data.exports.toc}
      lastUpdate={page.data.exports.lastModified}
      tableOfContent={{
        enabled: page.data.toc,
        footer: (
          <a
            href={`https://github.com/ryanwaits/hiro-docs/blob/main/${path}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            Edit on Github <ExternalLinkIcon className="ml-1 size-3" />
          </a>
        ),
      }}
    >
      {page.data.title !== "Home" && (
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {prefix} {page.data.title}
        </h1>
      )}
      {page.data.title !== "Home" && (
        <p className="mb-8 text-lg text-muted-foreground">
          {page.data.description}
        </p>
      )}
      <DocsBody>
        {preview && preview in Preview ? Preview[preview] : null}
        {page.data.index ? (
          <Category page={page} />
        ) : (
          <page.data.exports.default />
        )}
      </DocsBody>
    </DocsPage>
  );
}

function Category({ page }: { page: Page }): JSX.Element {
  const filtered = utils.files.filter(
    (docs) =>
      docs.type === "page" &&
      docs.file.dirname === page.file.dirname &&
      docs.file.name !== "index"
  ) as Page[];

  return (
    <Cards>
      {filtered.map((item) => (
        <Card
          key={item.url}
          title={item.data.title}
          description={item.data.description ?? "No Description"}
          href={item.url}
        />
      ))}
    </Cards>
  );
}

export function generateMetadata({ params }: { params: Param }): Metadata {
  const page = utils.getPage(params.slug);

  if (!page) notFound();

  const description =
    page.data.description ?? "The library for building documentation sites";

  const imageParams = new URLSearchParams();
  imageParams.set("title", page.data.title);
  imageParams.set("description", description);

  const image = {
    alt: "Banner",
    url: `/api/og/${params.slug[0]}?${imageParams.toString()}`,
    width: 1200,
    height: 630,
  };

  return createMetadata({
    title: page.data.title,
    description,
    openGraph: {
      url: `/docs/${page.slugs.join("/")}`,
      images: image,
    },
    twitter: {
      images: image,
    },
  });
}

export function generateStaticParams(): Param[] {
  return utils.getPages().map<Param>((page) => ({
    slug: page.slugs,
  }));
}
