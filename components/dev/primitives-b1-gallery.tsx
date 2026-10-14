"use client";

import { Select } from "@/components/ui/select";
import { Checkbox, Radio } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Menu } from "@/components/ui/menu";

export type PrimitivesB1Copy = {
  locale: "ar" | "en";
  switchOn: string;
  switchOff: string;
  selectLabel: string;
  selectHelper: string;
  selectError: string;
  selectDisabled: string;
  optA: string;
  optB: string;
  optC: string;
  checkLabel: string;
  checkDisabled: string;
  checkError: string;
  radioGroup: string;
  radioA: string;
  radioB: string;
  switchLabel: string;
  switchDisabled: string;
  cardPlain: string;
  cardInverse: string;
  cardMedia: string;
  cardInteractive: string;
  cardBody: string;
  tabsLabel: string;
  tabOne: string;
  tabTwo: string;
  tabThree: string;
  tabPanel: string;
  menuLabel: string;
  menuEdit: string;
  menuShare: string;
  menuDelete: string;
  menuDisabled: string;
  statesTitle: string;
  defaultState: string;
  errorState: string;
  disabledState: string;
};

function Surface({
  inverse,
  title,
  copy,
}: {
  inverse: boolean;
  title: string;
  copy: PrimitivesB1Copy;
}) {
  const options = [
    { value: "a", label: copy.optA },
    { value: "b", label: copy.optB },
    { value: "c", label: copy.optC },
  ] as const;

  return (
    <div
      className={
        inverse
          ? "ro-inverse space-y-8 rounded-[var(--ro-r-sm)] border border-ro-line-on-dark p-6"
          : "space-y-8 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper p-6"
      }
    >
      <h3 className="text-base font-semibold text-ro-ink">{title}</h3>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P03 Select · {copy.statesTitle}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label={`${copy.selectLabel} (${copy.defaultState})`}
            name={`sel-ok-${inverse ? "inv" : "lt"}`}
            options={options}
            defaultValue="a"
            helper={copy.selectHelper}
          />
          <Select
            label={`${copy.selectLabel} (${copy.errorState})`}
            name={`sel-err-${inverse ? "inv" : "lt"}`}
            options={options}
            error={copy.selectError}
          />
          <Select
            label={`${copy.selectLabel} (${copy.disabledState})`}
            name={`sel-dis-${inverse ? "inv" : "lt"}`}
            options={options}
            defaultValue="b"
            disabled
            helper={copy.selectDisabled}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P04 Checkbox / Radio
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Checkbox
              label={copy.checkLabel}
              name={`chk-${inverse ? "inv" : "lt"}`}
              defaultChecked
            />
            <Checkbox
              label={copy.checkDisabled}
              name={`chk-dis-${inverse ? "inv" : "lt"}`}
              disabled
            />
            <Checkbox
              label={copy.checkLabel}
              name={`chk-err-${inverse ? "inv" : "lt"}`}
              error={copy.checkError}
            />
          </div>
          <fieldset className="space-y-1 border-0 p-0">
            <legend className="mb-1 text-sm font-medium text-ro-ink">
              {copy.radioGroup}
            </legend>
            <Radio
              label={copy.radioA}
              name={`rad-${inverse ? "inv" : "lt"}`}
              value="a"
              defaultChecked
            />
            <Radio
              label={copy.radioB}
              name={`rad-${inverse ? "inv" : "lt"}`}
              value="b"
            />
          </fieldset>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P05 Switch
        </p>
        <div className="flex flex-wrap gap-6">
          <Switch
            label={copy.switchLabel}
            onLabel={copy.switchOn}
            offLabel={copy.switchOff}
            defaultChecked
          />
          <Switch
            label={copy.switchDisabled}
            onLabel={copy.switchOn}
            offLabel={copy.switchOff}
            disabled
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P07 Card
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="plain">
            <p className="font-semibold text-ro-ink">{copy.cardPlain}</p>
            <p className="mt-1 text-sm text-ro-text-2">{copy.cardBody}</p>
          </Card>
          <Card variant="inverse">
            <p className="font-semibold">{copy.cardInverse}</p>
            <p className="mt-1 text-sm text-ro-text-2">{copy.cardBody}</p>
          </Card>
          <Card
            variant="media"
            media={
              <div
                className="aspect-[16/10] bg-[var(--ro-sand-200)]"
                aria-hidden
              />
            }
          >
            <p className="font-semibold text-ro-ink">{copy.cardMedia}</p>
            <p className="mt-1 text-sm text-ro-text-2">{copy.cardBody}</p>
          </Card>
        </div>
        <Card href="/dev/ui" variant="plain">
          <p className="font-semibold text-ro-ink">{copy.cardInteractive}</p>
          <p className="mt-1 text-sm text-ro-text-2">{copy.cardBody}</p>
        </Card>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P10 Tabs
        </p>
        <Tabs
          label={copy.tabsLabel}
          items={[
            {
              id: "one",
              label: copy.tabOne,
              panel: <p>{copy.tabPanel} — 1</p>,
            },
            {
              id: "two",
              label: copy.tabTwo,
              panel: <p>{copy.tabPanel} — 2</p>,
            },
            {
              id: "three",
              label: copy.tabThree,
              panel: <p>{copy.tabPanel} — 3</p>,
              disabled: true,
            },
          ]}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P09 Menu / Popover
        </p>
        <Menu
          label={copy.menuLabel}
          triggerLabel={copy.menuLabel}
          items={[
            { id: "edit", label: copy.menuEdit },
            { id: "share", label: copy.menuShare },
            { id: "noop", label: copy.menuDisabled, disabled: true },
            { id: "del", label: copy.menuDelete, danger: true },
          ]}
        />
      </div>
    </div>
  );
}

export function PrimitivesB1Gallery({ copy }: { copy: PrimitivesB1Copy }) {
  const lightTitle = copy.locale === "ar" ? "سطح فاتح" : "Light surface";
  const inverseTitle =
    copy.locale === "ar" ? "سطح .ro-inverse" : ".ro-inverse surface";

  return (
    <div className="space-y-8">
      <Surface inverse={false} title={lightTitle} copy={copy} />
      <Surface inverse title={inverseTitle} copy={copy} />
    </div>
  );
}
