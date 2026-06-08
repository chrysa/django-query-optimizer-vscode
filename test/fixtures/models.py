from django.db import models


class Author(models.Model):
    name = models.CharField(max_length=200)


class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)

    def list_titles(self):
        # Intentionally inefficient access pattern for the SARIF fixture.
        return [b.title for b in self.author.book_set.all()]
