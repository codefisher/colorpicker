from django.contrib import admin
from django import forms
import json
from .models import Palette
from .formats import read_gpl

class PaletteForm(forms.ModelForm):
    FORMATS = (
        ('json', "JSON"),
        ('gpl', "GIMP Palette (gpl)")
    )
    palette_format = forms.ChoiceField(choices=FORMATS)

    def clean(self):
        cleaned_data = super(PaletteForm, self).clean()
        palette_format = self.cleaned_data.get('palette_format')
        if palette_format == 'gpl':
            data = read_gpl(self.cleaned_data.get('data'))
            if not self.cleaned_data.get('name') and data.get('name'):
                cleaned_data['name'] = data.get('name')
            elif self.cleaned_data.get('name'):
                data['name'] = self.cleaned_data.get('name')
            cleaned_data['data'] = json.dumps(data)
        return cleaned_data

    class Meta:
        model = Palette
        fields = ('name', 'data', 'palette_format')

class PaletteAdmin(admin.ModelAdmin):
    form = PaletteForm

admin.site.register(Palette, PaletteAdmin)

