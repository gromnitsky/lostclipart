## Guidelines

* Only SVGs are allowed.
* Max image size is ~5MB.
* Don't upload non-free images (aka "copyrighted material"). If you
  have a CD from 1992 w/ some god forsaken vector artwork on it, use
  "unknown" as a license & hope for the best.
* Don't upload porn of any kind, images intended to harass or
  threaten, or spam.

## Licenses

https://www.gnu.org/licenses/license-list.html#OtherLicenses

## Search

Imagine that a search bar is a shell console input. It expects
shell-like quoting & command line arguments. It doesn't expand
arguments, though.

| opt         | desc                 |
| ----------- | -------------------- |
| `-t NAME`   | search by a tag name |
| `-u NUMBER` | search by a user id  |
| `-l NAME`   | search by a license  |
| `-r`        | reverse sort         |

When you add any of `-t`, `-u`, `-l` it means AND. There is no OR.

### Examples:

Find all images that have a string in title/desc/tag that contains a
substring "cat" from a user w/ the id 12345:

    cat* -u 12345

## Converting WMF to SVG

Use Inkscape. A recipe for GNU Make:

~~~
%.svg: %.WMF
	inkscape "$<" --export-plain-svg="$@"
~~~

I tried ImageMagick first, but the results were pitiful.
