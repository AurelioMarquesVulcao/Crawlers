#!/bin/sh

# BSD 3-Clause License
# 
# Copyright (c) 2017, Péter Szakszon
# All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
# 
# * Redistributions of source code must retain the above copyright notice, this
#   list of conditions and the following disclaimer.
# 
# * Redistributions in binary form must reproduce the above copyright notice,
#   this list of conditions and the following disclaimer in the documentation
#   and/or other materials provided with the distribution.
# 
# * Neither the name of the copyright holder nor the names of its
#   contributors may be used to endorse or promote products derived from
#   this software without specific prior written permission.
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

# Source of this script:
# https://gist.github.com/szxp/2b0e5e86c1350274f049a28392fc25e0

# This script is shared on reddit. Don't delete it.
# https://www.reddit.com/r/git/comments/6nlnec/automatically_bump_git_tag_versions_and_create_a/?ref=share&ref_source=link

# A more complete example can be found here:
# https://github.com/szxp/kolibri/blob/master/release.sh

progname="$(basename $0)"
lockdir=/var/tmp/myserice-release
pidfile=$lockdir/pid

usage() {
    cat <<EOM
Usage
    $progname [<newtag> [<commit>]]
    $progname [-h|--help]
Description
    It tries to find the closest reachable tag from the specified commit 
    by git-describe. If <commit> argument is missing it defaults to HEAD. 
    The supported tag format is vX.Y.Z[-any-optional-suffix].
    Before the real tagging the user will be prompted for an 'Are you sure?'
    answer.
Examples
1) Suppose that there isn't any reachable tag by git-describe yet. 
   The suggested new tag will be:
     $progname                 -> v1.0.0
     $progname v1.2.3          -> v1.2.3
     $progname v1.2.3-ce       -> v1.2.3-ce
     $progname v1.2.3 abcd123  -> v1.2.3
2) Suppose that the closest reachable tag by git-describe is v1.2.1. 
   The suggested new tag will be:
     $progname                 -> v1.3.0
     $progname minor           -> v1.3.0
     $progname minor abcd123   -> v1.3.0
     $progname patch           -> v1.2.2
     $progname major           -> v2.0.0
     $progname v1.2.3          -> v1.2.3
     $progname v1.2.3 abcd123  -> v1.2.3
     $progname invalid         -> unsupported tag format
     $progname invalid abcd123 -> unsupported tag format
EOM
    exit 0
}
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
fi



clean_up() {
    echo "Clean up"
    trap - INT TERM HUP EXIT
    rm -rf "$lockdir"
    exit $1
}

error() {
    echo "${progname}: ${1:-"unknown error"}" 1>&2
}

error_exit() {
    error "$1"
    clean_up 1
}

git_describe() {
    commitish="${1:-"HEAD"}"
    git describe --always --first-parent "$commitish" || error_exit "cannot describe $commitish"
}

create_tag() {
    tag="$1"
    commit="${2:-"HEAD"}"
    commit="$(git rev-parse --verify --short ${commit}^{commit})"
    [ "$?" -eq 0 ] || error_exit "cannot rev-parse $2"

    newtag=   
    oldtag=
    major=
    minor=
    patch=
    ver="$(git_describe $commit)"
    ver="$(echo "$ver" | grep -oP -e '^v[0-9+\.[0-9]+\.[0-9]+')"
    if [ "$?" -eq 0 ]; then       
        oldtag="$ver"
        ver=${ver#v}
        IFS=. read major minor patch <<EOF
$ver
EOF
    fi
    
    if [ -n "$oldtag" ]; then
        case "$tag" in
            "major") newtag="v$(expr $major + 1).0.0" ;;
            "minor") newtag="v$major.$(expr $minor + 1).0" ;;
            "patch") newtag="v$major.$minor.$(expr $patch + 1)" ;;
        esac
    fi

    if [ -z "$newtag" ] && [ -n "$tag" ]; then
        case "$tag" in
            "major") error_exit "cannot increment major number, because no previous tag can be found" ;;
            "minor") error_exit "cannot increment minor number, because no previous tag can be found" ;;
            "patch") error_exit "cannot increment patch number, because no previous tag can be found" ;;
             v*.*.*) newtag="$tag" ;;
                  *) error_exit "unsupported tag format '$tag'; supported formats: 'major', 'minor', 'patch', 'vX.Y.Z'" ;;
        esac
    fi
    
    if [ -z "$newtag" ]; then
        newtag="v1.0.0"
    fi

    while true; do
        read -p "Reachable previous tag from commit $commit: '${oldtag:-"none"}'. Do you wish to create tag '$newtag'? [y/n] " yn
        case $yn in
            [Yy]*) break ;;
            [Nn]*) error_exit "aborted" ;;
                *) echo "Please answer y[es] or n[o]" ;;
        esac
    done
    
    echo "Create tag $newtag $commit"
    git tag -a "$newtag" -m "version $newtag" "$commit" || error_exit "cannot create tag $newtag"
}

trap clean_up INT TERM HUP EXIT

if ( mkdir ${lockdir} ) 2> /dev/null; then
    echo $$ > $pidfile || error_exit "cannot write $pidfile"
    create_tag "$1" "$2"
else
    error "lock exists: $lockdir owned by $(cat $pidfile)"
fi
