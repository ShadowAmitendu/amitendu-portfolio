---
layout: base.njk
title: Author Profile
headerTagline: AUTHOR PROFILE
slug: shadow-amitendu
name: Amitendu Bikash Dhusiya
image: /images/authors/2026-10-14-amitendu-bikash-dhusiya.webp
bio: A simple and creative developer using niche stuff!
hideHeroImage: true
---

<div class="site-card border border-[#b7cbd6] bg-[#f4f8fa] p-6 shadow-[inset_0_1px_0_#fff]">
  <div class="flex items-start gap-4">
    {% if image %}<img class="site-profile-frame h-24 w-24 shrink-0 object-cover" src="{{ image }}" alt="{{ name }}" />{% endif %}
    <div>
      <h2 class="font-bold text-lg text-[#164b70]">{{ name }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-[#26343d]">{{ bio }}</p>
    </div>
  </div>
</div>

<p class="mt-6"><a class="text-[#064f83] underline hover:text-[#c0392b]" href="/about/">← view full about page</a></p>
