import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ComponentPartSchema = new Schema(
  {
    label: { type: String, default: "" },
    code: { type: String, default: "" },
  },
  { _id: false },
);

const ComponentSchema = new Schema(
  {
    description: { type: String, default: "" },
    code: { type: String, default: "" },
    category: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    components: { type: [ComponentPartSchema], default: [] },
    qtyAvailable: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

export type ComponentDoc = InferSchemaType<typeof ComponentSchema>;

export const Component: Model<ComponentDoc> =
  (mongoose.models.Component as Model<ComponentDoc>) ??
  mongoose.model<ComponentDoc>("Component", ComponentSchema);

/** Shape a lean/document into the CatalogItem shape the UI expects. */
export function serializeComponent(doc: {
  _id: unknown;
  description?: string;
  code?: string;
  category: string;
  slug: string;
  components?: { label?: string; code?: string }[];
  qtyAvailable?: number;
}) {
  return {
    id: String(doc._id),
    category: doc.category,
    slug: doc.slug,
    description: doc.description ?? "",
    code: doc.code ?? "",
    qtyAvailable: doc.qtyAvailable ?? 0,
    components: (doc.components ?? []).map((c) => ({
      label: c.label ?? "",
      code: c.code ?? "",
    })),
  };
}
