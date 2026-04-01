import { ArtisanTemplate } from "./ArtisanTemplate";
import { CascadeTemplate } from "./CascadeTemplate";
import { CoolTemplate } from "./coolTemplate";
import { ExecutiveTemplate } from "./ExecutiveTemplate";
import { MilanTemplate } from "./MilanTemplate";
import { ModernistTemplate } from "./ModernistTemplate";
import { SimpleWhiteTemplate } from "./SimpleWhiteTemplate";

export const templateMap: { [key: string]: React.FC<any> } = {
    'artisan': ArtisanTemplate,
    'cascade': CascadeTemplate,
    'cool': CoolTemplate,
    'executive': ExecutiveTemplate,
    'milan': MilanTemplate,
    'modernist': ModernistTemplate,
    'simple-white': SimpleWhiteTemplate,
}; 