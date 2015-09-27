from django.db import models

class Palette(models.Model):
    name = models.CharField(max_length=100)
    data = models.TextField()

    def __unicode__(self):
        return self.name