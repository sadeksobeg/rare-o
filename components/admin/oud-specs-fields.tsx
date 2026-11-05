"use client";

import type { CSSProperties, ReactNode } from "react";
import { OudSpecIconMark } from "@/components/catalog/oud-spec-icon";
import {
  SuggestEnTextPair,
  type SuggestEnLabels,
} from "@/components/admin/suggest-en";
import { TextField } from "@/components/ui/text-field";
import type { OudSpecIconKey, OudSpecsFormValues } from "@/lib/catalog/oud-specs";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
} from "@/lib/ui/form-classes";
import { cn } from "@/lib/utils";

type WoodRow = {
  arName: string;
  enName: string;
  label: string;
  arValue: string;
  enValue: string;
  icon: OudSpecIconKey;
};

type MeasureRow = {
  name: string;
  label: string;
  value: string;
  icon: OudSpecIconKey;
};

function SpecSection({
  title,
  icon,
  children,
  index = 0,
}: {
  title: string;
  icon: OudSpecIconKey;
  children: ReactNode;
  index?: number;
}) {
  return (
    <section
      className="ro-oud-admin-section"
      style={{ "--ro-oud-spec-i": index } as CSSProperties}
    >
      <header className="ro-oud-admin-section__head">
        <OudSpecIconMark iconKey={icon} size="lg" />
        <p className="ro-oud-admin-section__title">{title}</p>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FieldIconLabel({
  icon,
  children,
}: {
  icon: OudSpecIconKey;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <OudSpecIconMark iconKey={icon} size="sm" className="mt-6 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function OudSpecsFields({
  labels,
  values,
  translate,
}: {
  labels: Dictionary["adminUi"]["form"];
  values: OudSpecsFormValues;
  translate: SuggestEnLabels;
}) {
  const wood: WoodRow[] = [
    {
      arName: "oudWoodBackAr",
      enName: "oudWoodBackEn",
      label: labels.oudWoodBack,
      arValue: values.woodBackAr,
      enValue: values.woodBackEn,
      icon: "back",
    },
    {
      arName: "oudWoodFaceAr",
      enName: "oudWoodFaceEn",
      label: labels.oudWoodFace,
      arValue: values.woodFaceAr,
      enValue: values.woodFaceEn,
      icon: "face",
    },
    {
      arName: "oudWoodPegsAr",
      enName: "oudWoodPegsEn",
      label: labels.oudWoodPegs,
      arValue: values.woodPegsAr,
      enValue: values.woodPegsEn,
      icon: "pegs",
    },
    {
      arName: "oudWoodFingerboardAr",
      enName: "oudWoodFingerboardEn",
      label: labels.oudWoodFingerboard,
      arValue: values.woodFingerboardAr,
      enValue: values.woodFingerboardEn,
      icon: "fingerboard",
    },
    {
      arName: "oudWoodBridgeAr",
      enName: "oudWoodBridgeEn",
      label: labels.oudWoodBridge,
      arValue: values.woodBridgeAr,
      enValue: values.woodBridgeEn,
      icon: "bridge",
    },
  ];

  const measures: MeasureRow[] = [
    {
      name: "oudFaceWidthMm",
      label: labels.oudFaceWidth,
      value: values.faceWidthMm,
      icon: "faceWidth",
    },
    {
      name: "oudFaceDepthMm",
      label: labels.oudFaceDepth,
      value: values.faceDepthMm,
      icon: "faceDepth",
    },
    {
      name: "oudFaceLengthMm",
      label: labels.oudFaceLength,
      value: values.faceLengthMm,
      icon: "faceLength",
    },
    {
      name: "oudNeckLengthMm",
      label: labels.oudNeckLength,
      value: values.neckLengthMm,
      icon: "neckLength",
    },
    {
      name: "oudStringLengthMm",
      label: labels.oudStringLength,
      value: values.stringLengthMm,
      icon: "stringLength",
    },
  ];

  return (
    <fieldset
      className={cn(
        "space-y-5 rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-subtle)]",
        "bg-[color:var(--ro-bg-raised)] p-4 sm:p-5"
      )}
    >
      <legend className="flex items-center gap-2 px-1">
        <OudSpecIconMark iconKey="face" size="md" />
        <span className={controlLabelTextClass}>{labels.oudSpecsTitle}</span>
      </legend>
      <p className="text-xs leading-relaxed text-ro-muted">{labels.oudSpecsHint}</p>

      <SpecSection title={labels.oudWoodTitle} icon="back" index={0}>
        {wood.map((row) => (
          <FieldIconLabel key={row.arName} icon={row.icon}>
            <SuggestEnTextPair
              key={`${row.arName}-pair`}
              arName={row.arName}
              enName={row.enName}
              arLabel={`${row.label} (${labels.oudAr})`}
              enLabel={`${row.label} (${labels.oudEn})`}
              arDefault={row.arValue}
              enDefault={row.enValue}
              labels={translate}
              dense
            />
          </FieldIconLabel>
        ))}
      </SpecSection>

      <SpecSection title={labels.oudMeasuresTitle} icon="faceWidth" index={1}>
        <div className="grid gap-3 sm:grid-cols-2">
          {measures.map((row) => (
            <FieldIconLabel key={row.name} icon={row.icon}>
              <TextField
                name={row.name}
                label={row.label}
                helper={labels.oudMm}
                type="number"
                min={0}
                max={9999}
                step="0.1"
                dir="ltr"
                defaultValue={row.value}
                dense
              />
            </FieldIconLabel>
          ))}
        </div>
      </SpecSection>

      <SpecSection title={labels.oudDetailsTitle} icon="finish" index={2}>
        <FieldIconLabel icon="standardNeck">
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{labels.oudStandardNeck}</span>
            <select
              name="oudStandardNeck"
              defaultValue={values.standardNeck}
              className={controlClass}
            >
              <option value="">{labels.oudStandardNeckUnset}</option>
              <option value="yes">{labels.oudStandardNeckYes}</option>
              <option value="no">{labels.oudStandardNeckNo}</option>
            </select>
          </label>
        </FieldIconLabel>
        <FieldIconLabel icon="finish">
          <SuggestEnTextPair
            arName="oudFinishAr"
            enName="oudFinishEn"
            arLabel={`${labels.oudFinish} (${labels.oudAr})`}
            enLabel={`${labels.oudFinish} (${labels.oudEn})`}
            arDefault={values.finishAr}
            enDefault={values.finishEn}
            labels={translate}
            dense
          />
        </FieldIconLabel>
      </SpecSection>
    </fieldset>
  );
}
